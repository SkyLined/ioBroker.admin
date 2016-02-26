function Instances(main) {
    var that = this;

    this.$grid         = $('#grid-instances');
    this.$gridhead     = $('#grid-instances-head');
    this.$configFrame  = $('#config-iframe');
    this.$dialogConfig = $('#dialog-config');

    this.main          = main;
    this.list          = [];
    this.lTrue         = '';
    this.lFalse        = '';
    this.hostsText     = null;

    function replaceInLink(link, adapter, instance) {
        var vars = link.match(/\%(\w+)\%/g);
        if (vars) {
            for (var v = 0; v < vars.length; v++) {
                var _var = vars[v].replace(/\%/g, '');
                if (_var.match(/^native_/))  _var = _var.substring(7);

                // like web.0_port
                var parts;
                if (_var.indexOf('_') == -1) {
                    parts = [adapter + '.' + instance, _var];
                } else {
                    parts = _var.split('_');
                    // add .0 if not defined
                    if (!parts[0].match(/\.[0-9]+$/)) {
                        var inst = 0;
                        while (inst < 10 && !that.main.objects['system.adapter.' + parts[0] + '.' + inst]) {
                            inst++;
                        }

                        if (that.main.objects['system.adapter.' + parts[0] + '.' + inst]) parts[0] += '.' + inst;
                    }
                }
                if (parts[1] == 'protocol') parts[1] = 'secure';

                if (_var == 'ip') {
                    link = link.replace('%' + _var + '%', location.hostname);
                } else
                if (_var == 'instance') {
                    link = link.replace('%' + _var + '%', instance);
                } else {
                    var obj = that.main.objects['system.adapter.' + parts[0]];

                    if (obj) {
                        var val = obj.native[parts[1]];
                        if (_var == 'bind' && (!val || val == '0.0.0.0')) val = location.hostname;

                        if (parts[1] == 'secure') {
                            link = link.replace('%' + _var + '%', val ? 'https' : 'http');
                        } else {
                            if (link.indexOf('%' + _var + '%') == -1) {
                                link = link.replace('%native_' + _var + '%', val);
                            } else {
                                link = link.replace('%' + _var + '%', val);
                            }
                        }
                    } else {
                        if (parts[1] == 'secure') {
                            link = link.replace('%' + _var + '%', 'http');
                        } else {
                            if (link.indexOf('%' + _var + '%') === -1) {
                                link = link.replace('%native_' + _var + '%', '');
                            } else {
                                link = link.replace('%' + _var + '%', '');
                            }
                        }
                    }

                }
            }
        }

        return link;
    }

    function updateLed(instanceId) {
        var tmp      = instanceId.split('.');
        var adapter  = tmp[2];
        var instance = tmp[3];

        var $led = $('.instance-led[data-instance-id="' + instanceId + '"]');

        var common   = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        var state = (common.mode === 'daemon') ? 'green' : 'blue';
        var title = _('Connected to host: ');
        if (!that.main.states[instanceId + '.connected'] || !that.main.states[instanceId + '.connected'].val) {
            title += ((common.mode === 'daemon') ? '<span style="color: red">' + _('false') + '</span>' : _('false'));
            state = (common.mode === 'daemon') ? 'red' : 'blue';
        } else {
            title += '<span style="color: green">' + _('true') + '</span>';
        }
        title += '<br>';
        title += _('Alive: ');
        if (!that.main.states[instanceId + '.alive'] || !that.main.states[instanceId + '.alive'].val) {
            title += ((common.mode === 'daemon') ? '<span style="color: red">' + _('false') + '</span>' : _('false'));
            state = (common.mode === 'daemon') ? 'red' : 'blue';
        } else {
            title += '<span style="color: green">' + _('true') + '</span>';
        }

        if (that.main.states[adapter + '.' + instance + '.info.connection']) {
            title += '<br>';
            title += _('Connected to %s: ', adapter);
            var val = that.main.states[adapter + '.' + instance + '.info.connection'].val;
            if (!val) {
                state = 'orange';
                title += '<span style="color: red">' + _('false') + '</span>';
            } else {
                if (val === true) {
                    title += '<span style="color: green">' + _('true') + '</span>';
                } else {
                    title += '<span style="color: green">' + val + '</span>';
                }
            }
        }

        state = (state == 'blue') ? '' : state;

        $led.removeClass('led-red led-green led-orange led-blue').addClass('led-' + state).data('title', title);
        if (!$led.data('inited')) {
            $led.data('inited', true);

            $led.hover(function () {
                var text = '<div class="instance-state-hover" style="' +
                    'left: ' + Math.round($(this).position().left + $(this).width() + 5) + 'px;">' + $(this).data('title') + '</div>';
                var $big = $(text);

                $big.insertAfter($(this));
                $(this).data('big', $big[0]);
                var h = parseFloat($big.height());
                var top = Math.round($(this).position().top - ((h - parseFloat($(this).height())) / 2));
                if (h + top > (window.innerHeight || document.documentElement.clientHeight)) {
                    top = (window.innerHeight || document.documentElement.clientHeight) - h;
                }
                if (top < 0) {
                    top = 0;
                }
                $big.css({top: top});
            }, function () {
                var big = $(this).data('big');
                $(big).remove();
                $(this).data('big', undefined);
            });
        }
    }

    function createHead() {
        var text = '<tr>';
        // _('name'), _('instance'), _('title'), _('enabled'), _('host'), _('mode'), _('schedule'), '', _('platform'), _('loglevel'), _('memlimit'), _('alive'), _('connected')],
        text += '<th style="width: 2em"></th>';
        text += '<th style="width: 10em">' + _('instance') + '</th>';
        text += '<th style="width: 2em"></th>';
        text += '<th style="width: 11em"></th>';
        text += '<th style="text-align: left">' + _('title') + '</th>';

        if (that.main.tabs.hosts.list.length > 1) {
            text += '<th style="width: 10em">' + _('host') + '</th>';
        }
        text += '<th style="width: 8em">' + _('cron') + '</th>';
        if (that.main.config.expertMode) {
            text += '<th style="width: 8em">' + _('loglevel') + '</th>';
            text += '<th style="width: 8em">' + _('memlimit') + '</th>';
        }
        that.$gridhead.html(text);
    }

    function showOneAdapter(rootElem, instanceId, form, justContent) {
        var text;
        var common   = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        var tmp      = instanceId.split('.');
        var adapter  = tmp[2];
        var instance = tmp[3];

        if (form === 'tile') {
            text = justContent ? '' : '<div class="instance-adapter" data-instance-id="' + instanceId + '">';
            text += justContent ? '' : '</div>';
        } else {
            // table
            text = justContent ? '' : '<tr class="instance-adapter" data-instance-id="' + instanceId + '">';

            var link = common.localLink || '';
            if (link) link = '<a href="' + replaceInLink(link, adapter, instance) + '" target="_blank">';

            // icon
            text += '<td>' + (common.icon ? link + '<img src="/adapter/' + adapter + '/' + common.icon + '" style="width: 2em; height: 2em" class="instance-image" data-instance-id="' + instanceId + '"/>' : '') + (link ? '</a>': '') + '</td>';

            // name and instance
            text += '<td style="padding-left: 0.5em"><b>' + adapter + '.' + instance + '</b></td>';

            // State -
            //             red - adapter is not connected or not alive,
            //             orange - adapter is connected and alive, but device is not connected,
            //             green - adapter is connected and alive, device is connected or no device,
            text += '<td class="instance-state" style="text-align: center"><div class="instance-led" style="margin-left: 0.5em; width: 1em; height: 1em;" data-instance-id="' + instanceId + '"></div></td>';
            // buttons
            text += '<td style="text-align: center">' +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-stop-run"></button>' +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-settings" data-instance-href="/adapter/' + adapter + '/?' + instance + '" ></button>' +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-edit"></button>' +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-reload"></button>' +
                '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-del"></button>'+
                '</td>';

            // title
            text += '<td data-name="title" data-value="' + (common.title || '') + '" class="instance-editable" data-instance-id="' + instanceId + '">' + link + (common.title || '') + (link ? '</a>': '') + '</td>';


            // host - hide it if only one host
            if (that.main.tabs.hosts.list.length > 1) {
                if (!that.hostsText) {
                    that.hostsText = '';
                    for(var h = 0; h < that.main.tabs.hosts.list.length;h++) {
                        var host = that.main.tabs.hosts.list[h] || '';
                        that.hostsText += (that.hostsText ? ';' : '') + host.id + ':' + host.name;
                    }
                }
                text += '<td data-name="host" data-value="' + (common.host || '') + '" class="instance-editable" data-instance-id="' + instanceId + '" data-options="' + that.hostsText + '">' + (common.host || '') + '</td>';
            }
            // schedule
            text += '<td data-name="schedule" data-value="' + (common.mode === 'schedule' ? (common.schedule || '') : '') + '" style="text-align: center" class="' + (common.mode === 'schedule' ? 'instance-editable' : '') + '" data-instance-id="' + instanceId + '">' + (common.mode === 'schedule' ? (common.schedule || '') : '') + '</td>';

            // debug level (only experts)
            if (that.main.config.expertMode) {
                text += '<td data-name="loglevel" data-value="' + (common.loglevel || '') + '"  style="text-align: center" class="instance-editable" data-instance-id="' + instanceId + '" data-options="debug:debug;info:info;warn:warn;error:error">' + (common.loglevel || '') + '</td>';
            }

            // Max RAM  (only experts)
            if (that.main.config.expertMode) {
                text += '<td data-name="memoryLimitMB" data-value="' + (common.memoryLimitMB || '') + '" style="text-align: center" class="instance-editable" data-instance-id="' + instanceId + '">' + (common.memoryLimitMB || '') + '</td>';
            }

            text += justContent ? '' : '</tr>';
        }
        if (!justContent) {
            rootElem.append(text);
        } else {
            $('.instance-adapter[data-instance-id="' + instanceId + '"]').html(text);
        }
        // init buttons
        that.initButtons(instanceId);
        updateLed(instanceId);
        // init links
        $('.instance-editable[data-instance-id="' + instanceId + '"]')
            .click(onQuickEditField)
            .addClass('select-id-quick-edit');
    }

    function applyFilter(filter) {
        if (filter === undefined) filter = $('#instances-filter').val();
        var invisible = [];
        if (filter) {
            var reg = new RegExp(filter);

            for (var i = 0; i < that.list.length; i++) {
                var obj = that.main.objects[that.list[i]];
                if (!obj || !obj.common) {
                    that.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').hide();
                    continue;
                }
                var isShow = 'hide';
                if (obj.common.name && reg.test(obj.common.name)) {
                    isShow = 'show';
                } else
                if (obj.common.title && reg.test(obj.common.title)) {
                    isShow = 'show';
                } else
                if (filter === 'true') {
                    isShow = this.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').find('instance-led').hasClass('led-green') ? 'show' : 'hide';
                } else
                if (filter === 'false') {
                    isShow = this.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').find('instance-led').hasClass('led-green') ? 'hide' : 'show';
                }
                if (isShow === 'hide') invisible.push(that.list[i]);
                that.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]')[isShow]();
            }
        } else {
            that.$grid.find('.instance-adapter').show();
        }

        // set odd and even
        var count = 0;
        for (var i = 0; i < that.list.length; i++) {
            var obj = that.main.objects[that.list[i]];
            if (!obj) continue;
            if (invisible.indexOf(that.list[i]) !== -1) continue;
            that.$grid.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').removeClass('instance-odd instance-even').addClass((count % 2) ? 'instance-odd' : 'instance-even');
            count++;
        }
    }

    function onQuickEditField(e) {
        var $this   = $(this);
        var id      = $this.data('instance-id');
        var attr    = $this.data('name');
        var options = $this.data('options');
        var oldVal  = $this.data('value');
        var textAlign = $this.css('text-align');
        $this.css('text-align', 'left');
        var states  = null;

        $this.unbind('click').removeClass('select-id-quick-edit').css('position', 'relative');

        var css = 'cursor: pointer; position: absolute;width: 16px; height: 16px; top: 2px; border-radius: 6px; z-index: 3; background-color: lightgray';
        var type = 'text';
        var text;

        if (options) {
            var opt = options.split(';');
            text = '<select style="width: calc(100% - 50px); z-index: 2">';
            for (var i = 0; i < opt.length; i++) {
                var parts = opt[i].split(':');
                text += '<option value="' + parts[0] + '">' + (parts[1] || parts[0]) + '</option>';
            }
            text += '</select>';
        }
        text = text || '<input style="' + (type !== 'checkbox' ? 'width: 100%;' : '') + ' z-index: 2" type="' + type + '"/>';

        var timeout = null;

        $this.html(text +
            '<div class="ui-icon ui-icon-check        select-id-quick-edit-ok"     style="margin-top: 0.45em;' + css + ';right: 22px"></div>' +
            '<div class="cancel ui-icon ui-icon-close select-id-quick-edit-cancel" style="margin-top: 0.45em;' + css + ';right: 2px" title="' + _('cancel') + '" ></div>');

        var $input = (options) ? $this.find('select') : $this.find('input');

        $this.find('.select-id-quick-edit-cancel').click(function (e)  {
            if (timeout) clearTimeout(timeout);
            timeout = null;
            e.preventDefault();
            e.stopPropagation();
            if (oldVal === undefined) oldVal = '';
            $this.html(oldVal)
                .click(onQuickEditField)
                .addClass('select-id-quick-edit')
                .css('text-align', textAlign);
        });

        $this.find('.select-id-quick-edit-ok').click(function ()  {
            $this.trigger('blur');
        });

        $input.val(oldVal);

        $input.blur(function () {
            timeout = setTimeout(function () {
                var val = $(this).val();

                if (JSON.stringify(val) != JSON.stringify(oldVal)) {
                    var obj = {common: {}};
                    obj.common[attr] = $(this).val()
                    that.main.socket.emit('extendObject', id, obj, function (err) {
                        if (err) that.main.showError(err);
                    });


                    oldVal = '<span style="color: pink">' + oldVal + '</span>';
                }
                $this.html(oldVal)
                    .click(onQuickEditField)
                    .addClass('select-id-quick-edit')
                    .css('text-align', textAlign);
            }.bind(this), 100);
        }).keyup(function (e) {
            if (e.which == 13) $(this).trigger('blur');
            if (e.which == 27) {
                if (oldVal === undefined) oldVal = '';
                $this.html(oldVal)
                    .click(onQuickEditField)
                    .addClass('select-id-quick-edit')
                    .css('text-align', textAlign);
            }
        });

        if (typeof e === 'object') {
            e.preventDefault();
            e.stopPropagation();
        }

        setTimeout(function () {
            $input.focus().select();
        }, 100);
    }

    this.prepare = function () {
        /*
        this.$grid.jqGrid({
            datatype: 'local',
            colNames: ['id', 'availableModes',  '', _('name'), _('instance'), _('title'), _('enabled'), _('host'), _('mode'), _('schedule'), '', _('platform'), _('loglevel'), _('memlimit'), _('alive'), _('connected')],
            colModel: [
                {name: '_id',       index: '_id',       hidden: true},
                {name: 'availableModes', index:'availableModes', hidden: true},
                {name: 'image',     index: 'image',     width: 22,   editable: false, sortable: false, search: false, align: 'center'},
                {name: 'name',      index: 'name',      width: 100},
                {name: 'instance',  index: 'instance',  width: 70},
                {name: 'title',     index: 'title',     width: 180,  editable: true},
                {name: 'enabled',   index: 'enabled',   width: 50,   editable: true, edittype: 'checkbox', editoptions: {value: _('true') + ':' + _('false')}, align: 'center'},
                {name: 'host',      index: 'host',      width: 80,   editable: true, edittype: 'select',   editoptions: ''},
                {name: 'mode',      index: 'mode',      width: 60,   editable: true, edittype: 'select',   editoptions: {value: null}, align: 'center'},
                {name: 'schedule',  index: 'schedule',  width: 60,   align: 'center', editable: true},
                {name: 'buttons',   index: 'buttons',   width: 90,   align: 'center', sortable: false, search: false},
                {name: 'platform',  index: 'platform',  width: 60,   hidden: true},
                {name: 'loglevel',  index: 'loglevel',  width: 50,   align: 'center', editable: true, edittype: 'select', editoptions: {value: 'debug:debug;info:info;warn:warn;error:error'}},
                {name: 'memlimit',  index: 'memlimit',  width: 40,   editable: true, search: false},
                {name: 'alive',     index: 'alive',     width: 50,   align: 'center'},
                {name: 'connected', index: 'connected', width: 50,   align: 'center'}
            ],
            pager:         $('#pager-instances'),
            rowNum:        100,
            rowList:       [20, 50, 100],
            sortname:      "id",
            sortorder:     "desc",
            viewrecords:   true,
            loadComplete:  function () {
               that.initButtons();
            },
            caption:       _('ioBroker adapter instances'),
            ignoreCase:    true,
            ondblClickRow: function (rowId, e) {
                var rowData = that.$grid.jqGrid('getRowData', rowId);
                that.onEdit(rowData._id);
            },
            postData: that.main.config.instancesFilter ? { filters: that.main.config.instancesFilter} : undefined,
            search: !!that.main.config.instancesFilter
        }).jqGrid('filterToolbar', {
            defaultSearch: 'cn',
            autosearch:    true,
            searchOnEnter: false,
            enableClear:   false,
            afterSearch:   function () {
                that.initButtons();
                // Save filter
                that.main.saveConfig('instancesFilter', that.$grid.getGridParam("postData").filters);
            }
        }).navGrid('#pager-instances', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption: '',
            buttonicon: 'ui-icon-gear',
            onClickButton: function () {
                var objSelected = that.$grid.jqGrid('getGridParam', 'selrow');
                if (!objSelected) {
                    $('[id^="grid-objects"][id$="_t"]').each(function () {
                        if ($(this).jqGrid('getGridParam', 'selrow')) {
                            objSelected = $(this).jqGrid('getGridParam', 'selrow');
                        }
                    });
                }
                var obj = that.$grid.jqGrid('getRowData', objSelected);
                that.main.tabs.objects.edit(obj._id);
            },
            position: 'first',
            id: 'edit-instance',
            title: _('edit instance'),
            cursor: 'pointer'
        }).jqGrid('navButtonAdd', '#pager-instances', {
            caption:    '',
            buttonicon: 'ui-icon-refresh',
            onClickButton: function () {
                that.init(true);
            },
            position:   'first',
            id:         'reload-instances',
            title:      _('reload instance'),
            cursor:     'pointer'
        });
*/
        this.$dialogConfig.dialog({
            autoOpen:   false,
            modal:      true,
            width:      830, //$(window).width() > 920 ? 920: $(window).width(),
            height:     536, //$(window).height() - 100, // 480
            closeOnEscape: false,
            open: function (event, ui) {
                that.$dialogConfig.css('padding', '2px 0px');
            },
            beforeClose: function () {
                if (window.frames['config-iframe'].changed) {
                    return confirm(_('Are you sure? Changes are not saved.'));
                }
                var pos  = $(this).parent().position();
                var name = $(this).data('name');
                that.main.saveConfig('adapter-config-top-' + name,  pos.top);
                that.main.saveConfig('adapter-config-left-' + name, pos.left);

                return true;
            },
            close: function () {
                // Clear iframe
                that.$configFrame.attr('src', '');
            },
            resize: function () {
                var name = $(this).data('name');
                that.main.saveConfig('adapter-config-width-'  + name, $(this).parent().width());
                that.main.saveConfig('adapter-config-height-' + name, $(this).parent().height() + 10);
            }
        });
        $('#instances-filter').change(function () {
            that.main.saveConfig('instancesFilter', $(this).val());
            applyFilter($(this).val());
        }).keyup(function () {
            if (that.filterTimeout) clearTimeout(that.filterTimeout);
            that.filterTimeout = setTimeout(function () {
                $('#instances-filter').trigger('change');
            }, 300);
        });
        if (that.main.config.instancesFilter && that.main.config.instancesFilter[0] != '{') {
            $('#instances-filter').val(that.main.config.instancesFilter);
            /*var filters = JSON.parse(that.main.config.instancesFilter);
            if (filters.rules) {
                for (var f = 0; f < filters.rules.length; f++) {
                    $('#gview_grid-instances #gs_' + filters.rules[f].field).val(filters.rules[f].data);
                }
            }*/
        }

        //$('#load_grid-instances').show();
        $('#btn-instances-expert-mode').button({
            icons: {primary: 'ui-icon-gear'},
            text:  false
        }).css({width: '1.5em', height: '1.5em'}).attr('title', _('Toggle expert mode')).click(function () {
            that.main.config.expertMode = !that.main.config.expertMode;
            that.main.saveConfig('expertMode', that.main.config.expertMode);
            that.init(true);
            if (that.main.config.expertMode) {
                $('#btn-instances-expert-mode').addClass('ui-state-error');
            } else {
                $('#btn-instances-expert-mode').removeClass('ui-state-error');
            }
        });
        if (that.main.config.expertMode) $('#btn-instances-expert-mode').addClass('ui-state-error');

        $('#btn-instances-reload').button({
            icons: {primary: 'ui-icon-refresh'},
            text:  false
        }).css({width: '1.5em', height: '1.5em'}).attr('title', _('reload')).click(function () {
            that.init(true);
        });
        $('#btn-instances-form').button({
            icons: {primary: 'ui-icon-refresh'},
            text:  false
        }).css({width: '1.5em', height: '1.5em'}).attr('title', _('reload')).click(function () {
            that.main.config.instanceForm = that.main.config.instanceForm === 'tile' ? 'list' : 'tile';
            that.main.saveCell('expertMode', that.main.config.expertMode);
            that.init(true);
        });

        $('#instances-filter-clear').button({icons: {primary: 'ui-icon-close'}, text: false}).css({width: '1em', height: '1em'}).click(function () {
            $('#instances-filter').val('').trigger('change');
        });
    };

    this.onEdit = function (id, e) {
        var rowData = this.$grid.jqGrid('getRowData', 'instance_' + id);

        $('.instance-edit').hide();
        $('.instance-settings').hide();
        $('.instance-reload').hide();
        $('.instance-del').hide();
        $('.instance-ok-submit[data-instance-id="' + id + '"]').show();
        $('.instance-cancel-submit[data-instance-id="' + id + '"]').show();
        $('#reload-instances').addClass('ui-state-disabled');
        $('#edit-instance').addClass('ui-state-disabled');

        // Set the colors
        var a = $('td[aria-describedby="grid-instances_enabled"]');
        var htmlTrue  = that.htmlBoolean(true);
        var htmlFalse = that.htmlBoolean(false);

        a.each(function (index) {
            var text = $(this).html();
            if (text == htmlTrue) {
                $(this).html(_('true'));
            } else if (text == htmlFalse) {
                $(this).html( _('false'));
            }
        });

        // Set the links
        var a = $('td[aria-describedby="grid-instances_title"]');
        a.each(function (index) {
            var text = $(this).html();
            var m = text.match(/\<a.*>(.*)\<\/a\>/);
            if (m) $(this).html(m[1]);
        });

        if (rowData.availableModes) {
            var list = {};
            var modes = rowData.availableModes.split(',');
            var editable = false;
            for (var i = 0; i < modes.length; i++) {
                list[modes[i]] = _(modes[i]);
                if (modes[i] == 'schedule') editable = true;
            }
            this.$grid.setColProp('mode', {
                editable:    true,
                edittype:    'select',
                editoptions: {value: list},
                align:       'center'
            });
            this.$grid.setColProp('schedule', {
                editable:    editable,
                align:       'center'
            });
        } else {
            this.$grid.setColProp('mode', {
                editable: false,
                align:    'center'
            });
            this.$grid.setColProp('schedule', {
                editable:    rowData.mode == 'schedule',
                align:       'center'
            });
        }
        this.$grid.jqGrid('editRow', 'instance_' + id, {'url': 'clientArray'});
    };

    this.replaceLink = function (_var, adapter, instance, elem) {
        _var = _var.replace(/\%/g, '');
        if (_var.match(/^native_/))  _var = _var.substring(7);
        // like web.0_port
        var parts;
        if (_var.indexOf('_') == -1) {
            parts = [
                adapter + '.' + instance,
                _var
            ]
        } else {
            parts = _var.split('_');
            // add .0 if not defined
            if (!parts[0].match(/\.[0-9]+$/)) parts[0] += '.0';
        }

        if (parts[1] == 'protocol') parts[1] = 'secure';

        if (_var == 'instance') {
            setTimeout(function () {
                var link;
                if (elem) {
                    link = $('#' + elem).data('src');
                } else {
                    link = $('#a_' + adapter + '_' + instance).attr('href');
                }

                link = link.replace('%instance%', instance);
                if (elem) {
                    $('#' + elem).data('src', link);
                } else {
                    $('#a_' + adapter + '_' + instance).attr('href', link);
                }
            }, 0);
            return;
        }

        this.main.socket.emit('getObject', 'system.adapter.' + parts[0], function (err, obj) {
            if (obj) {
                setTimeout(function () {
                    var link;
                    if (elem) {
                        link = $('#' + elem).data('src');
                    } else {
                        link = $('#a_' + adapter + '_' + instance).attr('href');
                    }
                    if (link) {
                        if (parts[1] == 'secure') {
                            link = link.replace('%' + _var + '%', obj.native[parts[1]] ? 'https' : 'http');
                        } else {
                            if (link.indexOf('%' + _var + '%') == -1) {
                                link = link.replace('%native_' + _var + '%', obj.native[parts[1]]);
                            } else {
                                link = link.replace('%' + _var + '%', obj.native[parts[1]]);
                            }
                        }
                        if (elem) {
                            $('#' + elem).data('src', link);
                        } else {
                            $('#a_' + adapter + '_' + instance).attr('href', link);
                        }
                    }
                }, 0);
            }
        });
    };

    this.replaceLinks = function (vars, adapter, instance, elem) {
        if (typeof vars != 'object') vars = [vars];
        for (var t = 0; t < vars.length; t++) {
            this.replaceLink(vars[t], adapter, instance, elem);
        }
    };

    this._replaceLink = function (link, _var, adapter, instance, callback) {
        // remove %%
        _var = _var.replace(/\%/g, '');

        if (_var.match(/^native_/)) _var = _var.substring(7);
        // like web.0_port
        var parts;
        if (_var.indexOf('_') == -1) {
            parts = [adapter + '.' + instance, _var];
        } else {
            parts = _var.split('_');
            // add .0 if not defined
            if (!parts[0].match(/\.[0-9]+$/)) parts[0] += '.0';
        }

        if (parts[1] == 'protocol') parts[1] = 'secure';

        this.main.socket.emit('getObject', 'system.adapter.' + parts[0], function (err, obj) {
            if (obj && link) {
                if (parts[1] == 'secure') {
                    link = link.replace('%' + _var + '%', obj.native[parts[1]] ? 'https' : 'http');
                } else {
                    if (link.indexOf('%' + _var + '%') == -1) {
                        link = link.replace('%native_' + _var + '%', obj.native[parts[1]]);
                    } else {
                        link = link.replace('%' + _var + '%', obj.native[parts[1]]);
                    }
                }
            } else {
                console.log('Cannot get link ' + parts[1]);
                link = link.replace('%' + _var + '%', '');
            }
            setTimeout(function () {
                callback(link, adapter, instance);
            }, 0);
        });
    };

    this._replaceLinks = function (link, adapter, instance, arg, callback) {
        if (!link) {
            return callback(link, adapter, instance, arg);
        }
        var vars = link.match(/\%(\w+)\%/g);
        if (!vars) {
            return callback(link, adapter, instance, arg);
        }
        if (vars[0] == '%ip%') {
            link = link.replace('%ip%', location.hostname);
            this._replaceLinks(link, adapter, instance, arg, callback);
            return;
        }
        if (vars[0] == '%instance%') {
            link = link.replace('%instance%', instance);
            this._replaceLinks(link, adapter, instance, arg, callback);
            return;
        }
        this._replaceLink(link, vars[0], adapter, instance, function (link, adapter, instance) {
            this._replaceLinks(link, adapter, instance, arg, callback);
        }.bind(this));
    };

    this.htmlBoolean = function (value) {
        if (value === 'true' || value === true) {
            if (!this.lTrue) this.lTrue = '<span class="true">' + _('true') + '</span>';
            return this.lTrue;
        } else if (value === 'false' || value === false) {
            if (!this.lFalse) this.lFalse = '<span class="false">' + _('false') + '</span>';
            return this.lFalse;
        } else {
            return value;
        }
    };

    this.enableColResize = function () {
        return;
        if (!$.fn.colResizable) return;
        if (this.$grid.parent().is(':visible')) {
            this.$grid.parent().colResizable({liveDrag: true});
        } /*else {
         setTimeout(function () {
         enableColResize();
         }, 1000);
         }*/
    };

    this.init = function (update) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        if (typeof this.$grid !== 'undefined' && (!this.$grid.data('inited') || update)) {
            this.$grid.data('inited', true);
            //this.$grid.jqGrid('clearGridData');

            this.list.sort();
            createHead();
            this.$grid.html('');

            for (var i = 0; i < this.list.length; i++) {
                var obj = this.main.objects[this.list[i]];
                if (!obj) continue;
                showOneAdapter(this.$grid, this.list[i], this.main.config.instanceForm);
                /*var tmp = obj._id.split('.');
                var adapter = tmp[2];
                var instance = tmp[3];
                var title = obj.common ? obj.common.title : '';
                var link  = obj.common.localLink || '';
                if (link && link.indexOf('%ip%') != -1) link = link.replace('%ip%', location.hostname);

                var vars = link.match(/\%(\w+)\%/g);
                if (vars) this.replaceLinks(vars, adapter, instance);

                this.$grid.jqGrid('addRowData', 'instance_' + this.list[i].replace(/ /g, '_'), {
                    _id:       obj._id,
                    availableModes: obj.common ? obj.common.availableModes : null,
                    image:     obj.common && obj.common.icon ? '<img src="/adapter/' + obj.common.name + '/' + obj.common.icon + '" width="22px" height="22px" class="instance-image" data-instance-id="' + this.list[i] + '"/>' : '',
                    name:      obj.common ? obj.common.name : '',
                    instance:  obj._id.slice(15),
                    title:     obj.common ? (link ? '<a href="' + link + '" id="a_' + adapter + '_' + instance + '" target="_blank">' + title + '</a>': title): '',
                    enabled:   obj.common ? (obj.common.enabled ? "true": "false") : "false",
                    host:      obj.common ? obj.common.host : '',
                    mode:      obj.common.mode,
                    schedule:  obj.common.mode === 'schedule' ? obj.common.schedule : '',
                    buttons:   '<button data-instance-id="' + this.list[i] + '" class="instance-settings" data-instance-href="/adapter/' + adapter + '/?' + instance + '" ></button>' +
                               '<button data-instance-id="' + this.list[i] + '" class="instance-edit"></button>' +
                               '<button data-instance-id="' + this.list[i] + '" class="instance-reload"></button>' +
                               '<button data-instance-id="' + this.list[i] + '" class="instance-del"></button>' +
                               '<button data-instance-id="' + this.list[i] + '" class="instance-ok-submit"     style="display:none"></button>' +
                               '<button data-instance-id="' + this.list[i] + '" class="instance-cancel-submit" style="display:none"></button>',
                    platform:  obj.common ? obj.common.platform : '',
                    loglevel:  obj.common ? obj.common.loglevel : '',
                    memlimit:  obj.common ? (obj.common.memoryLimitMB || '') : '',
                    alive:     this.main.states[obj._id + '.alive'] ? this.htmlBoolean(this.main.states[obj._id + '.alive'].val) : '',
                    connected: this.main.states[obj._id + '.connected'] ? this.htmlBoolean(this.main.states[obj._id + '.connected'].val) : ''
                });*/
            }
            //this.$grid.trigger('reloadGrid');

            // Set the colors
            /*var a = $('td[aria-describedby="grid-instances_enabled"]');
            a.each(function (index) {
                var text = $(this).html();
                if (text == 'true' || text == 'false') {
                    $(this).html(that.htmlBoolean(text));
                }
            });

            $('.host-selector').each(function () {
                var id = $(this).attr('data-id');
                $(this).val((that.main.objects[id] && that.main.objects[id].common) ? obj.common.host || '': '').
                    change(function () {
                        that.main.socket.emit('extendObject', $(this).attr('data-id'), {common:{host: $(this).val()}});
                    });
            });

            this.initButtons();
            // set cursor
            $('.ui-jqgrid-resize').css('cursor', 'e-resize');*/
            // install resize
            this.enableColResize();
            applyFilter();
        }
    };

    this.updateHosts = function (hosts) {
        var tmp = '';
        for (var k = 0; k < hosts.length; k++) {
            tmp += (k > 0 ? ';' : '') + hosts[k].name + ':' + hosts[k].name;
        }
        this.$grid.jqGrid('setColProp', 'host', {editoptions: {value: tmp}});
    };

    this.stateChange = function (id, state) {
        if (this.$grid) {
            var parts = id.split('.');
            var last = parts.pop();
            id = parts.join('.');
            if (this.list.indexOf(id) !== -1) {
                if (last === 'alive' || last === 'connected') {
                    updateLed(id);
                }
                return;
            }
            id = 'system.adapter.' + parts[0] + parts[1];
            if (this.list.indexOf(id) !== -1 && last === 'connection') {
                updateLed(id);
            }
            /*if (last === 'alive' && this.list.indexOf(id) !== -1) {
                var rowData = this.$grid.jqGrid('getRowData', 'instance_' + id);
                rowData.alive = (rowData.alive === true || rowData.alive === 'true' || rowData.alive == this.lTrue);
                var newVal = state ? state.val : false;
                newVal = (newVal === true || newVal === 'true');
                if (rowData.alive != newVal) {
                    rowData.alive = this.htmlBoolean(newVal);
                    this.$grid.jqGrid('setRowData', 'instance_' + id, rowData);
                    this.initButtons(id);
                }
            } else if (last === 'connected' && this.list.indexOf(id) !== -1) {
                var rowData = this.$grid.jqGrid('getRowData', 'instance_' + id);
                rowData.connected = (rowData.connected === true || rowData.connected === 'true' || rowData.connected == this.lTrue);
                var newVal = state ? state.val : false;
                newVal = (newVal === true || newVal === 'true');
                if (rowData.connected != newVal) {
                    rowData.connected = this.htmlBoolean(newVal);
                    this.$grid.jqGrid('setRowData', 'instance_' + id, rowData);
                    this.initButtons(id);
                }
            }*/
        }
    };

    this.objectChange = function (id, obj) {
        // Update Instance Table
        if (id.match(/^system\.adapter\.[-\w]+\.[0-9]+$/)) {
            if (obj) {
                if (this.list.indexOf(id) === -1) {
                    // add new instance
                    this.list.push(id);

                    if (this.updateTimer) clearTimeout(this.updateTimer);

                    this.updateTimer = setTimeout(function () {
                        that.updateTimer = null;
                        that.init(true);
                    }, 200);
                } else {
                    if (id.indexOf('.web.') !== -1) {
                        if (this.updateTimer) clearTimeout(this.updateTimer);

                        this.updateTimer = setTimeout(function () {
                            that.updateTimer = null;
                            that.init(true);
                        }, 200);
                    } else {
                        // update just one line or
                        this.$grid.find('.instance-adapter[data-instance-id="' + id + '"]').html(showOneAdapter(this.$grid, id, this.main.config.instanceForm, true));
                    }
                }
            } else {
                var i = this.list.indexOf(id);
                if (i != -1) {
                    this.list.splice(i, 1);
                    this.$grid.find('.instance-adapter[data-instance-id="' + id + '"]').remove();
                }
            }

            /*if (this.$grid !== undefined && this.$grid[0]._isInited) {
                if (this.updateTimer) clearTimeout(this.updateTimer);

                this.updateTimer = setTimeout(function () {
                    that.updateTimer = null;
                    that.init(true);
                }, 200);
            }*/
        } else
        // update list if some host changed
        if (id.match(/^system\.host\.[-\w]+$/)) {
            if (this.updateTimer) clearTimeout(this.updateTimer);

            this.updateTimer = setTimeout(function () {
                that.updateTimer = null;
                that.init(true);
            }, 200);
        }
    };

    this.initButtons = function (id) {
        id = id ? '[data-instance-id="' + id + '"]' : '';

        var $e = $('.instance-edit' + id).unbind('click').click(function () {
            that.onEdit($(this).attr('data-instance-id'));
        });

        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({
                icons: {primary: 'ui-icon-pencil'},
                text:  false
            }).css({width: '2em', height: '2em'}).attr('title', _('edit'));
        }

        $e = $('.instance-settings' + id).unbind('click')
            .click(function () {
                $iframeDialog = that.$dialogConfig;
                that.$configFrame.attr('src', $(this).attr('data-instance-href'));
                var name = $(this).attr('data-instance-id').replace(/^system\.adapter\./, '');
                var config = that.main.objects[$(this).attr('data-instance-id')];
                var width = 830;
                var height = 536;
                var minHeight = 0;
                var minWidth = 0;
                if (config.common.config) {
                    if (config.common.config.width)     width     = config.common.config.width;
                    if (config.common.config.height)    height    = config.common.config.height;
                    if (config.common.config.minWidth)  minWidth  = config.common.config.minWidth;
                    if (config.common.config.minHeight) minHeight = config.common.config.minHeight;
                }
                if (that.main.config['adapter-config-width-'  + name])  width = that.main.config['adapter-config-width-'  + name];
                if (that.main.config['adapter-config-height-' + name]) height = that.main.config['adapter-config-height-' + name];
                that.$dialogConfig.data('name', name);

                // Set minimal height and width
                that.$dialogConfig.dialog('option', 'minWidth',  minWidth).dialog('option', 'minHeight', minHeight);

                that.$dialogConfig
                    .dialog('option', 'title', _('Adapter configuration') + ': ' + name)
                    .dialog('option', 'width',  width)
                    .dialog('option', 'height', height)
                    .dialog('open');
                that.$dialogConfig.parent().find('.ui-widget-header button .ui-button-text').html('');

                if (that.main.config['adapter-config-top-'  + name])   that.$dialogConfig.parent().css({top:  that.main.config['adapter-config-top-' + name]});
                if (that.main.config['adapter-config-left-' + name])   that.$dialogConfig.parent().css({left: that.main.config['adapter-config-left-' + name]});
            });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-note'}, text: false}).css({width: '2em', height: '2em'}).attr('title', _('config'));
        }
		$e.each(function () {
            var _id = $(this).attr('data-instance-id');
            if (main.objects[_id] && main.objects[_id].common && main.objects[_id].common.noConfig) {
                $(this).button('disable');
            }
        });
		
        $e = $('.instance-reload' + id).unbind('click')
            .click(function () {
                that.main.socket.emit('extendObject', $(this).attr('data-instance-id'), {}, function (err) {
                    if (err) that.main.showError(err);
                });
            });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: '2em', height: '2em'}).attr('title', _('reload'));
        }
        $e = $('.instance-del' + id).unbind('click')
            .click(function () {
                var id = $(this).attr('data-instance-id');
                if (that.main.objects[id] && that.main.objects[id].common && that.main.objects[id].common.host) {
                    that.main.confirmMessage(_('Are you sure?'), null, 'help', function (result) {
                        if (result) {
                            that.main.cmdExec(that.main.objects[id].common.host, 'del ' + id.replace('system.adapter.', ''), function (exitCode) {
                                if (!exitCode) that.main.tabs.adapters.init(true);
                            });
                        }
                    });
                }
            });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-trash'}, text: false}).css({width: '2em', height: '2em'}).attr('title', _('delete'));
        }
        /*
        $e = $('.instance-ok-submit' + id).unbind('click').button({
            icons: {primary: 'ui-icon-check'},
            text:  false
        }).css({width: '2em', height: '2em'}).attr('title', _('ok')).click(function () {
            var id = $(this).attr('data-instance-id');
            $('.instance-edit').show();
            $('.instance-settings').show();
            $('.instance-reload').show();
            $('.instance-del').show();
            $('.instance-ok-submit').hide();
            $('.instance-cancel-submit').hide();
            $('#reload-instances').removeClass('ui-state-disabled');
            $('#edit-instance').removeClass('ui-state-disabled');

            that.$grid.jqGrid('saveRow', 'instance_' + id, {'url': 'clientArray'});
            // afterSave
            setTimeout(function () {
                var _obj = that.$grid.jqGrid('getRowData', 'instance_' + id);

                // Translate mode back
                var modes = that.$grid.jqGrid('getColProp', 'mode');
                if (modes) modes = modes.editoptions.value;
                for (var mode in modes) {
                    if (modes[mode] == _obj.mode) {
                        _obj.mode = mode;
                        break;
                    }
                }

                var obj = {common:{}};
                obj.common.host          = _obj.host;
                obj.common.loglevel      = _obj.loglevel;
                obj.common.memoryLimitMB = _obj.memlimit;
                obj.common.schedule      = _obj.schedule;
                obj.common.enabled       = _obj.enabled;
                obj.common.mode          = _obj.mode;
                obj.common.title         = _obj.title;

                if (obj.common.enabled === _('true'))  obj.common.enabled = true;
                if (obj.common.enabled === _('false')) obj.common.enabled = false;

                that.main.socket.emit('extendObject', _obj._id, obj, function (err) {
                    if (err) {
                        that.main.showError(err);
                        that.init(true);
                    }
                });
            }, 100);
        });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({icons: {primary: 'ui-icon-note'}, text: false}).css({width: 22, height: 18}).attr('title', _('ok'));
        }
        $e = $('.instance-cancel-submit' + id).unbind('click').click(function () {
            var id = $(this).attr('data-instance-id');
            $('.instance-edit').show();
            $('.instance-settings').show();
            $('.instance-reload').show();
            $('.instance-del').show();
            $('.instance-ok-submit').hide();
            $('.instance-cancel-submit').hide();
            $('#reload-instances').removeClass('ui-state-disabled');
            $('#edit-instance').removeClass('ui-state-disabled');
            that.$grid.jqGrid('restoreRow', 'instance_' + id, false);

            // Restore links
            for (var i = 0; i < that.list.length; i++) {
                var obj = that.main.objects[that.list[i]];
                if (!obj) continue;
                var tmp      = obj._id.split('.');
                var adapter  = tmp[2];
                var instance = tmp[3];

                var title = obj.common ? obj.common.title : '';
                var oldLink  = obj.common.localLink || '';
                var newLink  = oldLink;
                if (newLink && newLink.indexOf('%ip%') != -1) newLink = newLink.replace('%ip%', location.hostname);

                var vars = newLink.match(/\%(\w+)\%/g);
                if (newLink) {
                    var _obj = that.$grid.jqGrid('getRowData', 'instance_' + obj._id);
                    _obj.title = obj.common ? (newLink ? '<a href="' + newLink + '" id="a_' + adapter + '_' + instance + '" target="_blank">' + title + '</a>' : title): '';
                    that.$grid.jqGrid('setRowData', 'instance_' + obj._id, _obj);
                    that.initButtons(obj._id);
                    if (vars) that.replaceLinks(vars, adapter, instance);
                }
            }

            // Set the colors
            var a = $('td[aria-describedby="grid-instances_enabled"]');
            var htmlTrue  = that.htmlBoolean(true);
            var htmlFalse = that.htmlBoolean(false);

            a.each(function (index) {
                var text = $(this).html();
                if (text == _('true')) {
                    $(this).html(htmlTrue);
                } else if (text == _('false')) {
                    $(this).html(htmlFalse);
                }
            });

        });
        if (!$e.find('.ui-button-icon-primary').length) {
            $e.button({
                icons: {primary: 'ui-icon-close'},
                text:  false
            }).css({width: '2em', height: '2em'}).attr('title', _('cancel'));
        }*/
        $('.instance-image' + id).each(function () {
            if (!$(this).data('installed')) {
                $(this).data('installed', true);
                $(this).hover(function () {
                    var text = '<div class="icon-large" style="' +
                        'left: ' + Math.round($(this).position().left + $(this).width() + 5) + 'px;"><img src="' + $(this).attr('src') + '"/></div>';
                    var $big = $(text);
                    $big.insertAfter($(this));
                    $(this).data('big', $big[0]);
                    var h = parseFloat($big.height());
                    var top = Math.round($(this).position().top - ((h - parseFloat($(this).height())) / 2));
                    if (h + top > (window.innerHeight || document.documentElement.clientHeight)) {
                        top = (window.innerHeight || document.documentElement.clientHeight) - h;
                    }
                    if (top < 0) {
                        top = 0;
                    }
                    $big.css({top: top});
                }, function () {
                    var big = $(this).data('big');
                    $(big).remove();
                    $(this).data('big', undefined);
                });
            }
        });
        $e = $('.instance-stop-run' + id).unbind('click')
            .click(function () {
                var id = $(this).attr('data-instance-id');
                that.main.socket.emit('extendObject', id, {common: {enabled: !that.main.objects[id].common.enabled}}, function (err) {
                    if (err) that.main.showError(err);
                });
            });

        if (!$e.find('.ui-button-icon-primary').length) {
            $e.each(function () {
                var id = $(this).attr('data-instance-id');
                $e.button({icons: {primary: that.main.objects[id].common.enabled ? 'ui-icon-pause': 'ui-icon-play'}, text: false})
                    .css({width: '2em', height: '2em', 'background-color': that.main.objects[id].common.enabled ? 'lightgreen' : '#FF9999'})
                    .attr('title', that.main.objects[id].common.enabled ? _('Activated. Click to stop.') : _('Deactivated. Click to start.'));
            });
        }
    };

    this.resize = function (width, height) {
        //this.$grid.setGridHeight(height - 150).setGridWidth(width);
    };
}
