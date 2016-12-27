/**
 * Created by hasee on 2016-12-27.
 */
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

function ManageSnapshotsDialog(node,action,vm){

    var vmname=new Ext.form.TextField({
        fieldLabel: _('Virtual Machine'),
        name: 'vmname',
        id: 'vmname',
        disabled:true,
        border:false,
        labelStyle: 'font-weight:bold;',
        width:320
    });

    vmname.setValue(vm.attributes.text);
    var store = new Ext.data.JsonStore({
        url:"/node/qcow2_snapshot_list?dom_id="+vm.attributes.id+
        "&node_id="+vm.parentNode.attributes.id,
        root: "snapshot_list",
        sortInfo: {
            field: 'id',
            direction: 'ASC'
        },
        fields:['id', 'tag','vm_size', 'date'],
        successProperty:'success',
        listeners:{
            loadexception:function(obj,opts,res,e){
                var msg=res.responseText;
                Ext.MessageBox.alert("Error",msg);
            }
        }
    })

    store.load();
    var columnModel = new Ext.grid.ColumnModel([
        {header: _("Id"), hidden: true, sortable: true, dataIndex: 'id'},
        {header: _("Snapshot Name"), width: 150, sortable: true, dataIndex: 'tag'},
        {header: _("Size"), width: 120, sortable: true, dataIndex: 'vm_size'},
        {header: _("Date"), width: 200, sortable: true, dataIndex: 'date'}
    ]);

    var selmodel=new Ext.grid.RowSelectionModel({
         singleSelect:true
    });
    var grid = new Ext.grid.GridPanel({
        store: store,
        colModel:columnModel,
        stripeRows: true,
        frame:false,
        border:false,
        width:'100%',
        autoExpandColumn:2,
        height:270,
        selModel:selmodel,
        enableColumnHide:false,
        tbar:[
            new Ext.Button({
                name: 'refresh',
                id: 'refresh',
                //tooltip:'Refresh',
                //tooltipType : "title",
                icon:'icons/refresh.png',
                cls:'x-btn-icon',
                listeners: {
                    click: function(btn) {
                        grid.getStore().load();
                    }
                }
            }),
            '-',
            new Ext.Button({
                name: 'clear',
                id: 'clear',
                tooltip:'Clear Selection',
                tooltipType : "title",
                hidden:false,
                icon:'icons/cancel.png',
                cls:'x-btn-icon',
                listeners: {
                    click: function(btn) {
                        grid.getSelectionModel().clearSelections();
                    }
                }
            }),
            '-',
            new Ext.Button({
                name: 'delete',
                id: 'delete',
                tooltip:_('Delete Snapshot'),
                tooltipType : "title",
                hidden:false,
                icon:'icons/delete.png',
                cls:'x-btn-icon',
                listeners: {
                    click: function(btn) {
                        //code to delete snapshot
                    }
                }
            })
        ],
        listeners: {
            rowclick: function(g,index,evt){
                //alert(g.getStore().getAt(index).get("tag"))
            },
            rowdblclick: function(g,index,evt) {
                //code to restore snapshot

            }
        }
    });

    var panel = new Ext.Panel({
        layout:'form',
        bodyStyle:'padding:15px 0px 0px 3px',
        cls: 'whitebackground',
        labelWidth:60,
        labelSeparator:' ',
        width:500,
        height:400,
        items:[vmname,grid],
        bbar:[{xtype: 'tbfill'},
            new Ext.Button({
                name: 'restore',
                id: 'restore',
                text:_('Restore'),
                icon:'icons/accept.png',
                cls:'x-btn-text-icon',
                listeners: {
                    click: function(btn) {
                        //code to restore snapshot
                    }
                }
            }),
            '-',
            new Ext.Button({
                name: 'cancel',
                id: 'cancel',
                text:_('Cancel'),
                icon:'icons/cancel.png',
                cls:'x-btn-text-icon',
                listeners: {
                    click: function(btn) {closeWindow();}
                }
            })
        ]
    });

    return panel;
}




