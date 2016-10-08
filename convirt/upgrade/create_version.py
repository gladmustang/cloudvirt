import os.path
import os
import sys
import fileinput
lib_path = os.path.abspath('../src/convirt/core/utils')
sys.path.append(lib_path )
import constants
def main():
    VERSION_FILE = "VERSION.TXT"
    SCHEMA_VERSION = "SCHEMA_VERSION"
    CONFIG_VERSION = "CONFIG_VERSION"
    DATA_VERSION = "DATA_VERSION"
    APP_VERSION = "APP_VERSION"

    print "Checking version information file " + VERSION_FILE + "..."
    if os.path.isfile(VERSION_FILE):
        print "Version information file " + VERSION_FILE + " exists. Exiting..."
    else:
        print "Version information file " + VERSION_FILE + " does not exist. Creating..."
        try:
	    print SCHEMA_VERSION +":"+ constants._version
            vfh = open(VERSION_FILE, 'w')
       	    vfh.write(SCHEMA_VERSION + ": " + constants._version + "\n")
	    vfh.write(CONFIG_VERSION + ": " + constants._version + "\n")
	    vfh.write(DATA_VERSION + ": " + constants._version + "\n")
	    vfh.write(APP_VERSION + ": " + constants._version + "\n")
	    print "Successfully created Version file " + VERSION_FILE
	    vfh.close()
        except IOError,e:
            print "ERROR: Failed to create or write to version information file " + VERSION_FILE + ": " + str(e)
            sys.exit(-1)
        finally:
	    if vfh is not None:
	        vfh.close()
    sys.exit(0)


if __name__ == '__main__':
   main()

