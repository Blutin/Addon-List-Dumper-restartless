// console.log("hello, world");

var addonsInfo = [[]];
var softInfo = "";
const addon = {
    id: 0,
    name: 1,
    icons: 2,
    isActive: 3,
    version: 4,
    description: 5,
    homepageURL: 6,
    installDate: 7,
    isCompatible: 8,
    type: 9
};

/* Get the needed addons information */

self.port.on("Config", function(addonsConfig) {
    addonsInfo = addonsConfig;
});

/* Get softInfo */

self.port.on("SoftInfo", function(softwareInfo) {
    softInfo = softwareInfo;
});

/* Get prefs to widget */

self.port.on("Prefs", function(preferences) {
    prefs = JSON.parse(preferences);
    //console.log(prefs.version);
    $("input[name='version']").prop("checked", prefs.version);
    $("input[name='description']").prop("checked", prefs.description);
    $("input[name='url']").prop("checked", prefs.url); 
    $("input[name='id']").prop("checked", prefs.id); 
    $("input[name='softInfo']").prop("checked", prefs.softInfo); 
    $("input[name='total']").prop("checked",prefs.total);
    $("input[name='date']").prop("checked",prefs.date);
    $("input[name='installDate']").prop("checked",prefs.installDate); 
    $("select[name='active']").val(prefs.active);
    $("select[name='type']").val(prefs.type);
    $("select[name='sort']").val(prefs.sort);
    
    // console.log($("input[name='version']").prop("checked"));
    // console.log(softInfo);
    
    buildOutput();
    
});

/* Build the output string */

function buildOutput(){
    let option = {
        softInfo: $("input[name='softInfo']").prop("checked"),
        version: $("input[name='version']").prop("checked"),
        description: $("input[name='description']").prop("checked"),
        url: $("input[name='url']").prop("checked"),
        id: $("input[name='id']").prop("checked"),
        total: $("input[name='total']").prop("checked"),
        date: $("input[name='date']").prop("checked"),
        installDate: $("input[name='installDate']").prop("checked"),
        active: $("select[name='active']").val(),
        type: $("select[name='type']").val(),
        sort: $("select[name='sort']").val(),

        selectActive: {
            All: function(){
                let addonItems = $.extend(true, [], addonsInfo);
                return addonItems;
            },
            Enabled: function(){
                return $.extend(true, [], addonsInfo.filter(function(elem){
                    return elem[addon.isActive];
                }));
            }, 
            Incompatible: function(){
                let addonItems = $.extend(true, [], addonsInfo.filter(function(elem){
                    return !elem[addon.isCompatible];
                }));
                
                return addonItems;
            },
            Disabled: function(){
                let addonItems = $.extend(true, [], addonsInfo.filter(function(elem){
                    return !elem[addon.isActive];
                }));
                
                return addonItems;
            }
        },
        
        selectType: {
            All: function(addons){
                return addons;
            },
            Extension: function(addons){
                return addons.filter(function(elem){
                    return (elem[addon.type] == "extension");
                });
            }, 
            Theme: function(addons){
                return addons.filter(function(elem){
                    return (elem[addon.type] == "theme");
                });
            }, 
            Plugin: function(addons){
                return addons.filter(function(elem){
                    return (elem[addon.type] == "plugin");
                });
            },
            Service: function(addons){
                return addons.filter(function(elem){
                    return (elem[addon.type] == "service");
                });
            },
            Locale: function(addons){
                return addons.filter(function(elem){
                    return (elem[addon.type] == "locale");
                });
            }
        },
        
        selectSort: {
            Name: function(addons){
                return addons.sort(function(a,b){
                    return a[addon.name].toLowerCase()>b[addon.name].toLowerCase(); // 2014-06-11: case insensitive
                });
            },
            InstallDate: function(addons){
                return addons.sort(function(a,b){
                    return (new Date(a[addon.installDate])) > (new Date(b[addon.installDate]));
                });
            },
            ID: function(addons){
                return addons.sort(function(a,b){
                    return a[addon.id]>b[addon.id];
                });
            }
        }
        
    };
    $("#items").val("");

    let dt = new Date(); 
    if (option.date)
        $("#items").val($("#items").val()+dt.toUTCString()+"\n\n"); // 2014-06-11: UTC TIME

    if (option.softInfo) // 2014-06-11: after date
        $("#items").val($("#items").val()+"User Agent: "+window.navigator.userAgent+"\n\n"); // 2014-06-12: User Agent

    /* Select All or Enabled or Disabled or Incompatible */
    let addonItems = option.selectActive[option.active]();
    
    /* Select All or Extension or Plugin or Locale */
    addonItems = option.selectType[option.type](addonItems);

    $("h4[name='total']").text("Total: "+addonItems.length);

    // BEG 2014-06-11: for specific counters
    function selectActiveAndType(active,type){
        /* Select active */
        let addonItemsSelected = option.selectActive[active]();
        /* Select type */
        addonItemsSelected = option.selectType[type](addonItemsSelected);
        /* result */
        return addonItemsSelected;
    };
    // END 2014-06-11: for specific counters

    // BEG 2014-06-11: output by type
    function addType(type){
        /* Select type */
        let addonItemsType = option.selectType[type](addonItems);
        /* Sort by name or install date or id */
        addonItemsType = option.selectSort[option.sort](addonItemsType);

        /* Counters - like InfoLister */
        if (option.total)
            if(type=="Extension")
                $("#items").val($("#items").val()+"*** "+type+"s (enabled: "+selectActiveAndType("Enabled",type).length+
                                ", disabled: "+selectActiveAndType("Disabled",type).length+"; total: "+
                                selectActiveAndType("All",type).length+")\n");
            else if(type=="Plugin")
                $("#items").val($("#items").val()+"*** "+type+"s (enabled: "+
                                selectActiveAndType("Enabled",type).length+")\n");
            else
                $("#items").val($("#items").val()+"*** "+type+"s (total: "+
                                selectActiveAndType("All",type).length+")\n");

        /* Addons - like InfoLister */
        for (let i=0; i<addonItemsType.length; ++i){
            $("#items").val($("#items").val()+addonItemsType[i][addon.name]+
                            (option.version ? (" "+addonItemsType[i][addon.version]) : "")+
                            (addonItemsType[i][addon.type]=="theme" ? (addonItemsType[i][addon.isActive] ? " (Selected)" : "") : (!addonItemsType[i][addon.isActive] ? " (Disabled)" : ""))+
                            (!addonItemsType[i][addon.isCompatible] ? " (Incompatible)\n" : "\n" )+
                            //" ["+addonItemsType[i][addon.type]+"]\n"+
                            (option.description ? "    "+addonItemsType[i][addon.description]+"\n" : "")+
                            (option.url && !(addonItemsType[i][addon.homepageURL]===null) ? "    "+addonItemsType[i][addon.homepageURL]+"\n" : "")+
                            (option.id ? "    "+addonItemsType[i][addon.id]+"\n" : "")+
                            (option.installDate ? "    "+(new Date(addonItemsType[i][addon.installDate])).toUTCString()+"\n" : ""));
        }

        /* Trailer */
        $("#items").val($("#items").val()+"\n");
    };

    /* output by type */
    if(option.type=="All" || option.type=="Extension")
        addType("Extension");
    if(option.type=="All" || option.type=="Theme")
        addType("Theme");
    if(option.type=="All" || option.type=="Plugin")
        addType("Plugin");
    if(option.type=="All")
        addType("Service");
    if(option.type=="All" || option.type=="Locale")
        addType("Locale");
    // END 2014-06-11: output by type
}

/* Update */
$("select, input[type='checkbox']").change(function(){
    buildOutput();
});

/* copy to clipboard */
$("input[name='clipboard']").click(function(){
    self.port.emit("Clipboard", $("#items").val());
});

/* save to file */
$("input[name='save']").click(function(){
    self.port.emit("SaveText", $("#items").val());
});

/* print */
$("input[name='print']").click(function(){
    $('#printHelper').text($('textarea').val());
    window.print();
});
