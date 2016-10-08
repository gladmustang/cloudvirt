import subprocess
from subprocess import Popen, PIPE
import os.path
import os
import sys
import fileinput
lib_path = os.path.abspath('../src/convirt/core/utils')
sys.path.append(lib_path )
import constants
def main(argv):
    if len(argv)!=4:
        print "Usage: python upgrade.py <dbtype> <dbname> <dbuser> <dbpassword>";
        print "Example: python upgrade.py mysql convirt dbuser dbpassword";
        sys.exit()
    dbtype=argv[0]
    dbname=argv[1]
    username=argv[2]
    passwd=argv[3]

    global VERSION_FILE,UPGRADE_PATH_FILE,SCHEMA_VERSION,CONFIG_VERSION,DATA_VERSION,APP_VERSION
    VERSION_FILE = "VERSION.TXT"
    UPGRADE_PATH_FILE = "UPGRADE_PATH.TXT"
    SCHEMA_VERSION = "SCHEMA_VERSION"
    CONFIG_VERSION = "CONFIG_VERSION"
    DATA_VERSION = "DATA_VERSION"
    APP_VERSION = "APP_VERSION"

    schema_version_val = None
    config_version_val = None
    data_version_val = None
    app_version_val = None

    print "Starting upgrade process..."
    if not os.path.isfile(UPGRADE_PATH_FILE):
        print "Upgrade file " + UPGRADE_PATH_FILE + " does not exist. Cannot proceed with the upgrade."
        sys.exit()

    if not os.path.isfile(VERSION_FILE):
        print "Version information file " + VERSION_FILE + " does not exist. Creating..."
        try:
            vfh = open(VERSION_FILE, 'w')
            vfh.write(SCHEMA_VERSION + ": " + constants._version + "\n")
            vfh.write(CONFIG_VERSION + ": " + constants._version + "\n")
            vfh.write(DATA_VERSION + ": " + constants._version + "\n")
            vfh.write(APP_VERSION + ": " + constants._version + "\n")
            print "Successfully created Version file " + VERSION_FILE
            vfh.close()
        except IOError,e:
            print "ERROR: Failed to open or write to file " + VERSION_FILE + ": " + str(e)
            sys.exit(-1)
        finally:
            if vfh is not None:
                vfh.close()
                vfh = None

    print ""
    print "Reading version information file " + VERSION_FILE + "..."
    lines = []
    try:
        vfh = file(VERSION_FILE,'r')
        lines = vfh.readlines()
    except IOError, e:
        print "ERROR: Failed to read file " + VERSION_FILE + ": " + str(e)
        sys.exit(-1)
    finally:
        if vfh is not None:
            vfh.close()
            vfh = None

    for line in lines:
        line = line.strip()
        if line.startswith("#") or len(line) == 0:
            continue
        tokens = line.split(":")
        if len(tokens) != 2:
            print "WARNING: Invalid format: " + line
            continue
        name = tokens[0].strip()
        value = tokens[1].strip()
        if name == SCHEMA_VERSION:
            schema_version_val = value
        elif name == CONFIG_VERSION:
            config_version_val = value
        elif name == DATA_VERSION:
            data_version_val = value
        elif name == APP_VERSION:
            app_version_val = value

    has_version_info = True
    if schema_version_val is None:
        print "ERROR: " + SCHEMA_VERSION + " information not found in " + VERSION_FILE
        has_version_info = False

    if config_version_val is None:
        print "ERROR: " + CONFIG_VERSION + " information not found in " + VERSION_FILE
        has_version_info = False

    if data_version_val is None:
        print "ERROR: " + DATA_VERSION + " information not found in " + VERSION_FILE
        has_version_info = False

    if has_version_info == False:
        print "ERROR: Cannot proceed with upgrade."
        sys.exit(-1)

    print "Successfully read version information file " + VERSION_FILE
    print ""
    print "Reading upgrade information file " + UPGRADE_PATH_FILE + "..."

    pfh = None
    try:
        pfh = file(UPGRADE_PATH_FILE, 'r')
        lines = pfh.readlines()
    except IOError, e:
        print "ERROR: Failed to read file " + UPGRADE_PATH_FILE + ": " + str(e)
        sys.exit(-1)
    finally:
        if pfh is not None:
            pfh.close()

    route_dic={}
    for line in lines:
        line = line.strip()

        if line.startswith("#") or len(line) == 0:
            continue

        tokens = line.split(":")
        if len(tokens) != 2:
            print "WARNING: Invalid format: " + line
            continue
        routes = tokens[1].strip().split(",")
        for route in routes:
            tokens = route.split("-")
            if len(tokens) != 2:
                continue
            from_version = tokens[0].strip()
            to_version = tokens[1].strip()
            route_dic[from_version] = to_version

    if len(route_dic) == 0:
       print "ERROR: Upgrade path information is not found in " + UPGRADE_PATH_FILE
       print "ERROR: Cannot proceed with upgrade"
       sys.exit(-1)

    print "Successfully read upgrade information file " + UPGRADE_PATH_FILE

    new_version = constants._version

    if upgrade_app(app_version_val, new_version) == False:
        print "ERROR: Application upgrade failed. Aborting upgrade process."
        sys.exit(-1)

    config_route = get_route(config_version_val, route_dic)
    if upgrade_config(config_route) == False:
        print "ERROR: Config upgrade failed. Aborting upgrade process."
        sys.exit(-1)

    schema_route = get_route(schema_version_val, route_dic)
    if upgrade_repository(schema_route, dbtype, dbname, username, passwd) == False:
        print "ERROR: Schema upgrade failed. Aborting upgrade process."
        sys.exit(-1)

    if upgrade_data(data_version_val, new_version) == False:
        print "ERROR: Data upgrade failed. Aborting upgrade process."
        sys.exit(-1)

    print ""
    print "Successfully completed upgrade process."
    sys.exit(0)

def upgrade_app(from_version, to_version):
    print ""
    print "Starting Application upgrade process..."
    if from_version == to_version:
        print "Application is up-to-date."
    else:
        replace_value(VERSION_FILE, APP_VERSION, to_version)
        print "Successfully upgraded Application from version " + from_version + " to " + to_version
    print "Completed Application upgrade process."
    return True

def get_route(from_version, route_dic):
    upgrade_route = []
    while (from_version in route_dic):
        to_version = route_dic[from_version]
        upgrade_route.append(from_version + "-" + to_version)
        from_version = to_version
    return upgrade_route

def upgrade_repository(upgrade_route, dbtype, dbname, username, passwd):
    return run_upgrade_script(upgrade_route, "./upgrade_repository.sh", SCHEMA_VERSION, "schema", dbtype, dbname, username, passwd)

def upgrade_config(upgrade_route):
    return run_upgrade_script(upgrade_route, "./upgrade_config.sh", CONFIG_VERSION, "config")

def run_upgrade_script(upgrade_route, script_name, version_key, name, dbtype=None, dbname=None, username=None, passwd=None):

    print ""
    print "Starting " + name + " upgrade process..."
    if len(upgrade_route) == 0:
        print name + " is up-to-date."
        print "Completed " + name + " upgrade process."
        return True

    db=""
    if dbtype is not None:
       db = dbtype + " " + dbname + " " + username + " " + passwd

    upgrade_status = True

    for route in upgrade_route:

        token = route.split('-');
        from_version = token[0]
        to_version = token[1]

        if not os.path.isdir(route):
            print "  No " + name + " upgrade files in upgrade path " + route
            continue

        if name == "config":
            if not os.path.isfile(route + "/upgrade_config"):
                print "  No " + name + " upgrade files in upgrade path " + route
                continue

        print "  Upgrading " + name + " from version " + from_version + " to " + to_version + "..."

        proc = subprocess.Popen(script_name + " " + route + " " + db, shell=True, close_fds=True)
        proc.wait()
        if proc.returncode != 0:
            upgrade_status = False
            break

    if upgrade_status == True:
        replace_value(VERSION_FILE, version_key, to_version)
        print "  Successfully upgraded " + name + " to " + to_version
    else:
        replace_value(VERSION_FILE, version_key, from_version)
        print "  ERROR: Failed to upgrade " + name + " to " + to_version + ". Upgraded till " + from_version
    print "Completed " + name + " upgrade process."

    return upgrade_status

def replace_value(file_name, key, value):
    for line in fileinput.input(file_name, inplace=True):
        tokens = line.split(':')
        if tokens[0].strip() == key:
            sys.stdout.write(line.replace(line, key + ": " + value + '\n'))
        else:
            sys.stdout.write(line)

def upgrade_data(from_version, to_version):

    status=True
    print ""
    print "Starting Data upgrade process..."

    if from_version == to_version:
        print "Data is up-to-date."
    else:
        cmd = "cd ..;paster setup-app src/convirt/web/convirt/development.ini"
        proc = subprocess.Popen(cmd, shell=True, close_fds=True)
        proc.wait()
        if proc.returncode == 0:
            print "Succesfully upgraded data from version " + from_version + " to " + to_version
        else:
            status=False
            print "ERROR: Failed to upgrade data from version " + from_version + " to " + to_version

    print "Completed Data upgrade process."
    return status

if __name__ == '__main__':
   main(sys.argv[1:])

