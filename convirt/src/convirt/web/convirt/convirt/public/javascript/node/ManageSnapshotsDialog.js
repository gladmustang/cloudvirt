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
        sortData: function(field, direction){
            direction = direction || 'ASC';
             var dir = direction == 'ASC' ? 1 : -1;
             var fn =  function(row1, row2){
                return  Number(row1.get(field))-Number(row2.get(field))
            };
            this.data.sort(direction, fn);
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
        {header: _("Snapshot Name"), width: 200, sortable: true, dataIndex: 'tag'},
        {header: _("Date"), width: 180, sortable: true, dataIndex: 'date'},
        {header: _("Size"), width: 100, sortable: true, dataIndex: 'vm_size'}

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
                text:_('Refresh'),
                icon:'icons/refresh.png',
                cls:'x-btn-text-icon',
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
                //tooltip:'Clear Selection',
                //tooltipType : "title",
                text:_('Clear Selection'),
                hidden:false,
                icon:'icons/clear.png',
                cls:'x-btn-text-icon',
                listeners: {
                    click: function(btn) {
                        grid.getSelectionModel().clearSelections();
                    }
                }
            }),
            {xtype: 'tbfill'},
            new Ext.Button({
                name: 'delete',
                id: 'delete',
                //tooltip:_('Delete Snapshot'),
                //tooltipType : "title",
                hidden:false,
                text: _('Remove Snapshot'),
                icon:'icons/delete.png',
                cls:'x-btn-text-icon',
                listeners: {
                    click: function(btn) {
                        //code to delete snapshot
                        deleteSnapshot.call(this);
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
        bbar:[
            {xtype: 'tbfill'},
            new Ext.Button({
                name: 'new',
                id: 'new',
                //tooltip:_('Delete Snapshot'),
                //tooltipType : "title",
                hidden:false,
                text: _('New Snapshot'),
                icon:'icons/add.png',
                cls:'x-btn-text-icon',
                listeners: {
                    click: function(btn) {
                        //code to add snapshot
                        snapshot_qcow2(vm);

                    }
                }
            }),
            '-',
            new Ext.Button({
                name: 'restore',
                id: 'restore',
                text:_('Restore Snapshot'),
                icon:'icons/accept.png',
                cls:'x-btn-text-icon',
                listeners: {
                    click: function(btn) {
                        //code to restore snapshot
                        restoreSnapshot();
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

    function snapshot_qcow2(vm){
        Ext.MessageBox.prompt(_("Snapshot"),_("Snapshot Name"), function(btn, text){
            if(btn=="ok")
                takeSnapshot(vm,text);
        }, this, false, "");


    }

    function takeSnapshot(vm,snapshot_name) {
        var url="/node/snapshot_qcow2?dom_id="+vm.attributes.id+
            "&node_id="+vm.parentNode.attributes.id+"&snapshot_name="+snapshot_name;
            var ajaxReq=ajaxRequest(url,0,"GET",true);
            ajaxReq.request({
                success: function(xhr) {
                    var response=Ext.util.JSON.decode(xhr.responseText);
                    if(response.success){
                        closeWindow();
                        show_task_popup(response.msg);
                    } else {
                        Ext.MessageBox.alert(_("Failure"),response.msg);
                    }
                },
                failure: function(xhr){
                    Ext.MessageBox.alert( _("Failure"), xhr.statusText);
                }
            });
    }

    function deleteSnapshot() {
        if (grid.getSelectionModel().getSelected()) {
            //console.dir(grid.getSelectionModel().getSelected().get("tag"))
            //var msg = "Delete snapshot " + grid.getSelectionModel().getSelected().get("tag") + " of " + vm.attributes.text + " ?";
            var msg= format(_("Delete snapshot {0} of {1} ?"), grid.getSelectionModel().getSelected().get("tag"), vm.attributes.text);
            Ext.MessageBox.confirm(_("Confirm"), _(msg), function (id) {
                if (id==="yes") {
                    var url="/node/qcow2_snapshot_delete?dom_id="+vm.attributes.id+
                    "&node_id="+vm.parentNode.attributes.id+"&snapshot_tag="+grid.getSelectionModel().getSelected().get("tag");
                    var ajaxReq=ajaxRequest(url,0,"GET",true);
                    ajaxReq.request({
                        success: function(xhr) {
                            var response=Ext.util.JSON.decode(xhr.responseText);
                            if(response.success){
                                Ext.MessageBox.alert(_("Success"),_(response.msg));
                                grid.getStore().load();//refresh snapshot list

                            } else {
                                Ext.MessageBox.alert(_("Failure"),response.msg);
                            }
                        },
                        failure: function(xhr){
                            Ext.MessageBox.alert( _("Failure"), xhr.statusText);
                        }
                    });
                }
            });
        }
    }


    function restoreSnapshot(){
        if (grid.getSelectionModel().getSelected()) {
            //console.dir(grid.getSelectionModel().getSelected().get("tag"))
            //var msg = "Restore snapshot " + grid.getSelectionModel().getSelected().get("tag") + " of " + vm.attributes.text + " ?";
            var msg= format(_("Restore snapshot {0} of {1} ?"), grid.getSelectionModel().getSelected().get("tag"), vm.attributes.text);
            Ext.MessageBox.confirm(_("Confirm"), _(msg), function (id) {
                if (id==="yes") {
                    var url="/node/qcow2_snapshot_restore?dom_id="+vm.attributes.id+
                    "&node_id="+vm.parentNode.attributes.id+"&snapshot_tag="+grid.getSelectionModel().getSelected().get("tag");
                    var ajaxReq=ajaxRequest(url,0,"GET",true);
                    ajaxReq.request({
                        success: function(xhr) {
                            var response=Ext.util.JSON.decode(xhr.responseText);
                            if(response.success){
                                closeWindow();
                                show_task_popup(response.msg);

                            } else {
                                Ext.MessageBox.alert(_("Failure"),response.msg);
                            }
                        },
                        failure: function(xhr){
                            Ext.MessageBox.alert( _("Failure"), xhr.statusText);
                        }
                    });
                }
            });
        }
    }

    return panel;
}




