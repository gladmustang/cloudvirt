/*
*   ConVirt   -  Copyright (c) 2008 Convirture Corp.
*   ======

* ConVirt is a Virtualization management tool with a graphical user
* interface that allows for performing the standard set of VM operations
* (start, stop, pause, kill, shutdown, reboot, snapshot, etc...). It
* also attempts to simplify various aspects of VM lifecycle management.


* This software is subject to the GNU General Public License, Version 2 (GPLv2)
* and for details, please consult it at:

* http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt
* author : Jd <jd_jedi@users.sourceforge.net>
*/

function _(s) {
    if (typeof(i18n) != 'undefined' && i18n[s]) {
        return i18n[s];
    }
    return s;
}


function r_(s) {
    if (typeof(r_i18n) != 'undefined') {
        for(var key in r_i18n) {
            if(typeof (r_i18n [key])=="function" )
                continue;
            var regx = eval(key);
            var match=null;
            if (match=regx.exec(s)) {
                var value=r_i18n[key];
                var params=""
                for(var i=1;i<match.length;i++) {
                    if(i!=match.length-1)
                        params+="'"+match[i]+"',"
                    else
                        params+="'"+match[i]+"'"
                }
                result = eval("format(value,"+params+")");
                return result;
            }

        }
        return s;
    }
}

