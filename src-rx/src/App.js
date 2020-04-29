import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import clsx from 'clsx';

import Connection from './components/Connection';
import { PROGRESS } from './components/Connection';
import Loader from '@iobroker/adapter-react/Components/Loader';
import I18n from '@iobroker/adapter-react/i18n';
import Router from '@iobroker/adapter-react/Components/Router';

// @material-ui/core
import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';

// import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Paper from '@material-ui/core/Paper';
import Snackbar from '@material-ui/core/Snackbar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

// @material-ui/icons
import AcUnitIcon from '@material-ui/icons/AcUnit';
import AppsIcon from '@material-ui/icons/Apps';
import ArtTrackIcon from '@material-ui/icons/ArtTrack';
import BuildIcon from '@material-ui/icons/Build';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CodeIcon from '@material-ui/icons/Code';
import DeviceHubIcon from '@material-ui/icons/DeviceHub';
import DvrIcon from '@material-ui/icons/Dvr';
import FlashOnIcon from '@material-ui/icons/FlashOn';
import InfoIcon from '@material-ui/icons/Info';
import MenuIcon from '@material-ui/icons/Menu';
import PermContactCalendarIcon from '@material-ui/icons/PermContactCalendar';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline';
import StorageIcon from '@material-ui/icons/Storage';
import StoreIcon from '@material-ui/icons/Store';
import SubscriptionsIcon from '@material-ui/icons/Subscriptions';
import SubtitlesIcon from '@material-ui/icons/Subtitles';
import ViewHeadlineIcon from '@material-ui/icons/ViewHeadline';
import ViewListIcon from '@material-ui/icons/ViewList';
import VisibilityIcon from '@material-ui/icons/Visibility';
import FilesIcon from '@material-ui/icons/FileCopy';
import ExpertIcon from './components/ExperIcon';

import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness5Icon from '@material-ui/icons/Brightness5';
import Brightness6Icon from '@material-ui/icons/Brightness6';
import Brightness7Icon from '@material-ui/icons/Brightness7';

// @material-ui/lab
import Alert from '@material-ui/lab/Alert';

import Drawer from './components/Drawer';
import DrawerItem from './components/DrawerItem';
import Connecting from './components/Connecting';

import { ThemeProvider } from '@material-ui/core/styles';
import theme from './Theme';
import Utils from './Utils';

import Login from './login/Login';

// Tabs
import Adapters from './tabs/Adapters';
import Instances from './tabs/Instances';
import Intro from './tabs/Intro';
import Logs from './tabs/Logs';
import Files from './tabs/Files';
import Objects from './tabs/Objects';

const drawerWidth = 180;

const styles = theme => ({
    root: {
        display: 'flex',
        height: '100%'
    },
    appBar: {
        /*backgroundColor: blue[300],*/
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    logoWhite: {
        background: '#FFFFFF'
    },
    appBarShift: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    hide: {
        display: 'none'
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(2),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginTop: theme.mixins.toolbar.minHeight,
        overflowY: 'auto',
        /*backgroundColor: grey[200]*/
    },
    contentMargin: {
        marginLeft: -drawerWidth,
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0
    },
    expertIcon: {
        width: 22,
        height: 22,
        //color: theme.palette.text ? theme.palette.text.disabled : 'grey'
    },
    expertIconActive: {
        //color: theme.palette.action.active
    }
});

class App extends Router {

    constructor(props) {

        super(props);

        String.prototype.ucFirst = function() {
            return this.substring(0, 1).toUpperCase() + this.substring(1).toLowerCase();
        };

        window.alert = message => {
            if (message.toLowerCase().includes('error')) {
                console.error(message);
                this.showAlert(message, 'error');
            } else {
                console.log(message);
                this.showAlert(message, 'info');
            }
        };

        this.translations = {
            'en': require('./i18n/en'),
            'de': require('./i18n/de'),
            'ru': require('./i18n/ru'),
            'pt': require('./i18n/pt'),
            'nl': require('./i18n/nl'),
            'fr': require('./i18n/fr'),
            'it': require('./i18n/it'),
            'es': require('./i18n/es'),
            'pl': require('./i18n/pl'),
            'zh-cn': require('./i18n/zh-cn'),
        };
        
        // init translations
        I18n.setTranslations(this.translations);
        I18n.setLanguage((navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase());

        if (window.location.pathname.split('/')[1] !== 'login') {

            this.state = {
                connected:      false,
                progress:       0,
                ready:          false,

                //Finished
                protocol:       this.getProtocol(),
                hostname:       window.location.hostname,
                port:           this.getPort(),
                //---------

                allTabs:        null,

                expertMode:     window.localStorage.getItem('App.expertMode') === 'true',
                
                states:         {},
                hosts:          [],
                currentHost:    '',
                currentTab:     Router.getLocation(),
                currentDialog:  null,
                currentUser:    '',
                subscribesStates: {},
                subscribesObjects: {},
                subscribesLogs: 0,
                systemConfig:   null,

                instances:      null,
                instancesLoaded: false,

                objects:        {},
                objectsLoaded:  false,
                objectsLoading: false,

                waitForRestart: false,
                tabs:           null,
                dialogs:        {},
                selectId:       null,
                config:         {},

                //==================== Finished
                logErrors: 0,
                logs: [],
                logSize: 0,
                //=============

                stateChanged: false,

                theme:          this.getTheme(),
                themeName:      this.getThemeName(this.getTheme()),
                themeType:      this.getThemeType(this.getTheme()),

                alert: false,
                alertType: 'info',
                alertMessage: '',
                drawerOpen: this.props.width !== 'xs',
                tab: null
            };

            this.tabsInfo = {
                'tab-intro':            {order: 1,    icon: <AppsIcon />},
                'tab-info':             {order: 5,    icon: <InfoIcon />,               host: true},
                'tab-adapters':         {order: 10,   icon: <StoreIcon />,              host: true},
                'tab-instances':        {order: 15,   icon: <SubtitlesIcon />,          host: true},
                'tab-objects':          {order: 20,   icon: <ViewListIcon />},
                'tab-enums':            {order: 25,   icon: <ArtTrackIcon />},
                'tab-devices':          {order: 27,   icon: <DvrIcon />,                host: true},
                'tab-logs':             {order: 30,   icon: <ViewHeadlineIcon />,       host: true},
                'tab-scenes':           {order: 35,   icon: <SubscriptionsIcon />},
                'tab-events':           {order: 40,   icon: <FlashOnIcon />},
                'tab-users':            {order: 45,   icon: <PersonOutlineIcon />},
                'tab-javascript':       {order: 50,   icon: <CodeIcon />},
                'tab-text2command-0':   {order: 55,   icon: <AcUnitIcon />},
                'tab-text2command-1':   {order: 56,   icon: <AcUnitIcon />},
                'tab-text2command-2':   {order: 57,   icon: <AcUnitIcon />},
                'tab-node-red-0':       {order: 60,   icon: <DeviceHubIcon />},
                'tab-node-red-1':       {order: 61,   icon: <DeviceHubIcon />},
                'tab-node-red-2':       {order: 62,   icon: <DeviceHubIcon />},
                'tab-fullcalendar-0':   {order: 65,   icon: <PermContactCalendarIcon />},
                'tab-fullcalendar-1':   {order: 66,   icon: <PermContactCalendarIcon />},
                'tab-fullcalendar-2':   {order: 67,   icon: <PermContactCalendarIcon />},
                'tab-hosts':            {order: 100,  icon: <StorageIcon />},
                'tab-files':            {order: 110,  icon: <FilesIcon />},
            };
        } else {
            this.state = {
                login: true,
                themeType: window.localStorage && window.localStorage.getItem('App.theme') ?
                    window.localStorage.getItem('App.theme') : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            }
        }
    }

    componentDidMount() {
        if(!this.state.login) {
            this.socket = new Connection({
                port: this.getPort(),
                autoSubscribes: ['*', 'system.adapter.*'],
                autoSubscribeLog: true,
                onProgress: progress => {
                    if (progress === PROGRESS.CONNECTING) {
                        this.setState({
                            connected: false
                        });
                    } else if (progress === PROGRESS.READY) {
                        this.setState({
                            connected: true,
                            progress: 100
                        });
                    } else {
                        this.setState({
                            connected: true,
                            progress: Math.round(PROGRESS.READY / progress * 100)
                        });
                    }
                },
                onReady: async (objects, scripts) => {

                    I18n.setLanguage(this.socket.systemLang);
                    window.systemLang = this.socket.systemLang;

                    this.socket.getStates(states => {
                        this.setState({
                            ready: true,
                            objects: objects,
                            states: states
                        });
                    });

                    // this.socket.subscribeObject('*', (id, obj) => this.onObjectChange(id, obj));
                    // this.socket.subscribeState('*', (id, state) => this.onStateChange(id, state));

                    await this.getSystemConfig();
                    await this.getHosts();

                    this.getTabs();

                    this.handleNavigation();

                    this.initLog();
                },
                //onObjectChange: (objects, scripts) => this.onObjectChange(objects, scripts),
                onError: error => {
                    console.error(error);
                    this.showAlert(error, 'error');
                },
                onLog: message => {

                    let error = this.state.logErrors;
                    const logs = (this.state.logs.length > 999) ?
                        this.state.logs.slice(1, 1000) : this.state.logs.slice();

                    logs.push(message);

                    if(message.severity === 'error') {
                        error++;
                    }

                    this.setState({
                        logs: logs,
                        logErrors: error
                    });
                }
            });
        }
    }

    initLog() {
        this.socket.getLogs(this.state.currentHost,200)
            .then(lines => {
            
            const size = lines ? Utils.formatBytes(lines.pop()) : -1;

            const logs = [];

            for (const i in lines) {

                const line = lines[i];

                const time = line.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/);

                if (time && time.length > 0) {
                    
                    const entry = {
                        _id: i,
                        from: line.match(/: (\D+\.\d+ \(|host\..+? )/)[0].replace(/[ :(]/g, ''),
                        message: line.split(/\[\d+m: /)[1],
                        severity: line.match(/\d+m(silly|debug|info|warn|error)/)[0].replace(/[\dm]/g, ''),
                        ts: new Date(time[0]).getTime()
                    };

                    logs.push(entry);
                } else {
                    if (logs.length > 0) {
                        logs[logs.length - 1].message += line;
                    }
                }
            }

            this.setState({
                logSize: size,
                logs: logs
            });
        });
    }

    clearLog() {
        this.clearLogErrors();
        this.setState({
            logs: []
        });
    }

    clearLogErrors() {
        if(this.state.logErrors !== 0) {
            this.setState({
                logErrors: 0
            });
        }
    }

    /**
     * Updates the current location in the states
     */
    onHashChanged() {
        this.setState({
            location: Router.getLocation()
        });
    }

    /**
     * Get the used port
     */
    getPort() {

        let port = parseInt(window.location.port, 10);

        if (isNaN(port)) {
            switch(this.getProtocol()) {
                case 'https:':
                    port = 443;
                    break;
                case 'http:':
                    port = 80;
                    break;
                default:
                    break;
            }
        }

        if (!port || port === 3000) {
            port = 8081;
        }

        return port;
    }

    /**
     * Get the used protocol
     */
    getProtocol() {
        return window.location.protocol;
    }

    /**
     * Get a theme
     * @param {string} name Theme name
     * @returns {Theme}
     */
    getTheme(name) {
        return theme(name ? name : window.localStorage && window.localStorage.getItem('App.theme') ?
            window.localStorage.getItem('App.theme') : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'colored');
    }

    /**
     * Get the theme name
     * @param {Theme} theme Theme
     * @returns {string} Theme name
     */
    getThemeName(theme) {
        return theme.name;
    }

    /**
     * Get the theme type
     * @param {Theme} theme Theme
     * @returns {string} Theme type
     */
    getThemeType(theme) {
        return theme.palette.type;
    }

    /**
     * Changes the current theme
     */
    toggleTheme() {

        const themeName = this.state.themeName;

        const newThemeName = themeName === 'dark' ? 'blue' :
            themeName === 'blue' ? 'colored' : themeName === 'colored' ? 'light' :
            themeName === 'light' ? 'dark' : 'colored';

        window.localStorage.setItem('App.theme', newThemeName);

        const theme = this.getTheme(newThemeName);

        this.setState({
            theme: theme,
            themeName: this.getThemeName(theme),
            themeType: this.getThemeType(theme)
        });
    }

    async onObjectChange(id, obj) {
        console.log('OBJECT: ' + id);
        if (obj) {
            this.setState(prevState => {
                
                const objects = prevState.objects;
                objects[id] = obj;

                return {
                    objects: objects
                };
            });
        } else {
            this.setState(prevState => {
                
                const objects = prevState.objects;
                delete objects[id];

                return {
                    objects: objects
                };
            });
        }
    }

    async onStateChange(id, state) {
        //console.log('STATE: ' + id);
        this.setState({
            stateChanged: true
        });
        /*if (state) {
            this.setState(prevState => {
                
                const states = prevState.states;
                states[id] = state;

                return {
                    states: states
                };
            });
        } else {
            this.setState(prevState => {
                
                const states = prevState.states;
                delete states[id];

                return {
                    states: states
                };
            });
        }*/
    }

    async getSystemConfig() {
        try {
            const systemConfig = await this.socket.getObject('system.config');
            this.setState({
                systemConfig: systemConfig
            });
        } catch(error) {
            console.log(error);
        }
    }

    async getHosts() {
        const hosts = await this.socket.getHosts();

        this.setState({
            hosts,
        });
    }

    getTabs() {

        let allTabs = [];
        /*for (let i = 0; i < main.instances.length; i++) {
            const instance = main.instances[i];
            const instanceObj = main.objects[instance];
            if (!instanceObj.common || !instanceObj.common.adminTab) continue;
            if (instanceObj.common.adminTab.singleton) {
                let isFound = false;
                const inst1 = instance.replace(/\.(\d+)$/, '.');
                for (let j = 0; j < addTabs.length; j++) {
                    const inst2 = addTabs[j].replace(/\.(\d+)$/, '.');
                    if (inst1 === inst2) {
                        isFound = true;
                        break;
                    }
                }
                if (!isFound) addTabs.push(instance);
            } else {
                addTabs.push(instance);
            }*/

        if (this.state.instances) {
            for (const instanceIndex in this.state.instances) {

                const instance = this.state.instances[instanceIndex];

                if (!instance.common || !instance.common.adminTab) continue;

                if (instance.common.adminTab.singleton) {
                    let isFound = false;
                    const inst1 = instance._id.replace(/\.(\d+)$/, '.');
                    for (const tabIndex in allTabs) {
                        const inst2 = allTabs[tabIndex].replace(/\.(\d+)$/, '.');
                        if (inst1 === inst2) {
                            isFound = true;
                            break;
                        }
                    }
                    if (!isFound) allTabs.push(instance._id);
                } else {
                    allTabs.push(instance._id);
                }
            }
        }

        this.setState({
            allTabs: allTabs,
            tabs: []
        });
    }

    async setTitle(title) {
        document.title = title + ' - ioBroker'; 
    }

    /*addEventMessage(id, stateOrObj, isMessage, isState) {
        /* // cannot directly use tabs.events.add, because to init time not available.
        tabs.events.add(id, stateOrObj, isMessage, isState));
    }

    saveConfig(attr, value) {
        if (attr) {
            const config = this.state.config.slice();
            config[attr] = value;
            this.setState({
            config: config
            })
        }

        if (typeof Storage !== 'undefined') {
            Storage.setItem('adminConfig', JSON.stringify(this.state.config));
        }
    }

    saveTabs() {
        try {  
            this.socket.setObject('system.config', this.state.systemConfig);
        } catch(error) {
            this.showError(error);
        }
    }*/

    /**
     * Format number in seconds to time text
     * @param {!number} seconds
     * @returns {String}
     */
    formatSeconds(seconds) {
        const days = Math.floor(seconds / (3600 * 24));
        seconds %= 3600 * 24;
        let hours = Math.floor(seconds / 3600);
        if (hours < 10) {
            hours = '0' + hours;
        }
        seconds %= 3600;
        let minutes = Math.floor(seconds / 60);
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        seconds %= 60;
        seconds = Math.floor(seconds);
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        let text = '';
        if (days) {
            text += days + ' ' + I18n.t('daysShortText') + ' ';
        }
        text += hours + ':' + minutes + ':' + seconds;

        return text;
    }

    /*getUser() {
        if (!this.state.currentUser) {
            this.socket.socket.emit('authEnabled', (auth, user) => {
                const currentUser = 'system.user.' + user;
                this.setState({
                    currentUser: currentUser,
                    authenticated: auth
                });
            });
        } else if (this.state.objects[this.state.currentUser]) {
            const obj = this.state.objects[this.state.currentUser];
            let name = '';

            if (!obj || !obj.common || !obj.common.name) {
                name = this.state.currentUser.replace(/^system\.user\./);
                name = name[0].toUpperCase() + name.substring(1).toLowerCase();
            } else {
                //name = translateName(obj.common.name);
            }

            if (obj && obj.common && obj.common.icon) {
                const objs = {};
                objs[this.state.currentUser] = obj;
                //$('#current-user-icon').html(main.getIcon(main.currentUser, null, objs));
            } else {
                //$('#current-user-icon').html('<i className="large material-icons">account_circle</i>');
            }
            //$('#current-user').html(name);
            const groups = [];
            for (let i = 0; i < this.state.tabs.users.groups.length; i++) {
                const group = this.state.objects[this.state.tabs.users.groups[i]];
                if (group && group.common && group.common.members && group.common.members.indexOf(this.state.currentUser) !== -1) {
                    //groups.push(_(translateName(group.common.name)));
                }
            }
            //$('#current-group').html(groups.join(', '));
        }
    }*/

    async getIntroInstances() {

        if (this.state.introInstancesLoaded) {
            return;
        }
        
        if (!this.state.instances) {
            await this.getAdapterInstances();
        }

        if (!this.state.instances) {
            return;
        }

        const deactivated = (this.state.systemConfig) ? this.state.systemConfig.common.intro || {} : {};
        const instances = this.state.instances.slice();
        const introInstances = [];

        instances.sort((a, b) => {
            a = a && a.common;
            b = b && b.common;
            a = a || {};
            b = b || {};

            if (a.order === undefined && b.order === undefined) {
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                return 0;
            } else if (a.order === undefined) {
                return -1;
            } else if (b.order === undefined) {
                return 1;
            } else {
                if (a.order > b.order) return 1;
                if (a.order < b.order) return -1;
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                return 0;
            }
        });

        for (const key in instances) {

            const obj = instances[key];
            const common = (obj) ? obj.common : null;
            const objId = obj._id.split('.');
            const instanceId = objId[objId.length - 1];

            if (common.name && common.name === 'admin' && common.localLink === (this.state.hostname || '')) {
                continue;
            } else if (common.name && common.name === 'web') {
                continue;
            } else if (common.name && common.name !== 'vis-web-admin' && common.name.match(/^vis-/)) {
                continue;
            } else if (common.name && common.name.match(/^icons-/)) {
                continue;
            } else if (common && (common.enabled || common.onlyWWW) && (common.localLinks || common.localLink)) {
                const instance = {};
                const ws = (common.welcomeScreen) ? common.welcomeScreen : null;
                
                instance.id = obj._id.replace('system.adapter.', '');
                instance.name = /*(ws && ws.name) ? ws.name :*/ (common.titleLang) ? common.titleLang[window.systemLang] : common.title;
                instance.color = (ws && ws.color) ? ws.color : '';
                instance.description = common.desc[window.systemLang];
                instance.image = (common.icon) ? 'adapter/' + common.name + '/' + common.icon : 'img/no-image.png';
                const link  = /*(ws && ws.link) ? ws.link :*/ common.localLinks || common.localLink || '';
                instance.link = this.replaceLink(link, common.name, instanceId);
                instance.active = (deactivated.hasOwnProperty(instance.id)) ? deactivated[instance.id] : true;
                instance.editActive = instance.active;
                introInstances.push(instance);
            }
        }

        /*var urlText = url.replace(/^https?:\/\//, '');
        var pos = urlText.indexOf('/');
        if (pos !== -1) {
            urlText = urlText.substring(0, pos);
        }
        if (adapter === 'admin' && urlText === location.host) return null;
        if (adapter === 'web') return null;
        if (adapter !== 'vis-web-admin' && adapter.match(/^vis-/)) return null; // no widgets
        if (adapter.match(/^icons-/)) return null; // no icons
    */

        const hosts = this.state.hosts;

        for (const key in hosts) {
            const obj = hosts[key];
            const common = (obj) ? obj.common : null;

            if (common) {
                const instance = {};

                const hostData = this.state.hostData[obj._id];

                instance.id = obj._id;
                instance.name = common.name;
                instance.color = '';
                instance.description = (
                    <ul>
                        <li>
                            <b>Platform: </b>
                            <span>{ (this.formatInfo['Platform'] ? this.formatInfo['Platform'](hostData['Platform']) : hostData['Platform'] || ' --') }</span>
                        </li>
                        <li>
                            <b>RAM: </b>
                            <span>{ (this.formatInfo['RAM'] ? this.formatInfo['RAM'](hostData['RAM']) : hostData['RAM'] || ' --') }</span>
                        </li>
                        <li>
                            <b>Node.js: </b>
                            <span>{ (this.formatInfo['Node.js'] ? this.formatInfo['Node.js'](hostData['Node.js']) : hostData['Node.js'] || ' --') }</span>
                        </li>
                        <li>
                            <b>NPM: </b>
                            <span>{ (this.formatInfo['NPM'] ? this.formatInfo['NPM'](hostData['NPM']) : hostData['NPM'] || ' --') }</span>
                        </li>
                    </ul>);
                instance.image = (common.icon) ? common.icon : 'img/no-image.png';
                instance.active = (deactivated.hasOwnProperty(instance.id)) ? deactivated[instance.id] : true;
                instance.editActive = instance.active;
                instance.info = I18n.t('Info');
                introInstances.push(instance);
            }
        }

        this.setState({
            introInstances: introInstances,
            introInstancesLoaded: true
        });
    }

    getCurrentTab() {
        if (this.state && this.state.currentTab) {
            if (this.state.currentTab.tab === 'tab-adapters') {
                return (
                    <Adapters
                        key="adapters"
                        expertMode={ this.state.expertMode }
                    />
                );
            } else
            if (this.state.currentTab.tab === 'tab-instances') {
                return (
                    <Instances
                        key="instances"
                        socket={ this.socket }
                        lang={ I18n.getLanguage() }
                        protocol={ this.state.protocol }
                        hostname={ this.state.hostname }
                        expertMode={ this.state.expertMode }
                        t={ I18n.t }
                    />
                );
            } else
            if (this.state.currentTab.tab === 'tab-logs') {
                return (
                    <Logs
                        key="logs"
                        logs={ this.state.logs }
                        size={ this.state.logSize }
                        t={ I18n.t }
                        lang={ I18n.getLanguage() }
                        socket={ this.socket }
                        expertMode={ this.state.expertMode }
                        currentHost={ this.state.currentHost }
                        clearLog={ () => this.clearLog() }
                        refreshLog={ () => this.initLog() }
                        clearErrors={ () => this.clearLogErrors() }
                    />
                );
            } else
            if (this.state.currentTab.tab === 'tab-files') {
                return (
                    <Files
                        key="files"
                        ready={ this.state.ready }
                        t={ I18n.t }
                        expertMode={ this.state.expertMode }
                        lang={ I18n.getLanguage() }
                        socket={ this.socket }
                    />
                );
            } else
            if (this.state.currentTab.tab === 'tab-objects') {
                return (
                    <Objects
                        key="objects"
                        t={ I18n.t }
                        themeName={ this.state.themeName }
                        expertMode={ this.state.expertMode }
                        lang={ I18n.getLanguage() }
                        socket={ this.socket }
                    />
                );
            }
        }

        return (
            <Intro
                key="intro"
                protocol={ this.state.protocol }
                hostname={ this.state.hostname }
                showAlert={ (message, type) => this.showAlert(message, type) }
                socket={ this.socket }
                systemConfig={ this.state.systemConfig }
                t={ I18n.t }
            />
        );
    }

    handleAlertClose(event, reason) {
        if (reason === 'clickaway') {
          return;
        }

        this.setState({
            alert: false
        });
    }

    showAlert(message, type) {
        
        if (type !== 'error' && type !== 'warning' && type !== 'info' && type !== 'success') {
            type = 'info';
        }

        this.setState({
            alert: true,
            alertType: type,
            alertMessage: message
        });
    }

    handleDrawerClose() {
        this.setState({
            drawerOpen: false
        });
    }

    handleDrawerOpen() {
        this.setState({
            drawerOpen: true
        });
    }

    handleNavigation(tab) {

        if (tab) {
            Router.doNavigate(tab);

            this.setState({
                currentTab: Router.getLocation()
            });
        }

        if (this.props.width === 'xs' || this.props.width === 'sm') {
            this.handleDrawerClose();
        }

        this.setTitle(tab ? tab.replace('tab-', '') : this.state.currentTab.tab.replace('tab-', ''));

        tab = tab || this.state.currentTab.tab || '';
    }

    getNavigationItems() {

        const items = [];
        const READY_TO_USE = ['tab-intro', 'tab-adapters', 'tab-instances', 'tab-logs', 'tab-files', 'tab-objects'];

        Object.keys(this.tabsInfo).forEach(name => {

            //For developing
            if (!READY_TO_USE.includes(name)) {
                return;
            }
            
            items.push(
                <DrawerItem
                    key={ name }
                    onClick={ () => this.handleNavigation(name) }
                    icon={ this.tabsInfo[name].icon }
                    text={ I18n.t(name.replace('tab-', '').ucFirst()) }
                    selected={ this.state.currentTab && this.state.currentTab.tab === name }
                    badgeContent={ name === 'tab-logs' ? this.state.logErrors : 0 }
                    badgeColor={ name === 'tab-logs' ? 'error' : '' }
                />
            );
        });

        return items;
    }

    render() {

        if (this.state.login) {
            return (
                <ThemeProvider theme={ this.state.theme }>
                    <Login t={ I18n.t } />
                </ThemeProvider>
            );
        }
        
        if (!this.state.ready) {
            return (
                <ThemeProvider theme={ this.state.theme }>
                    <Loader theme={ this.state.themeType } />
                </ThemeProvider>
            );
        }

        const { classes } = this.props;
        const small = this.props.width === 'xs' || this.props.width === 'sm';

        return (
            <ThemeProvider theme={ this.state.theme }>
                <Paper elevation={ 0 } className={ classes.root }>
                    <AppBar
                        color="default"
                        position="fixed"
                        className={ clsx(classes.appBar, {[classes.appBarShift]: !small && this.state.drawerOpen}) }
                    >
                        <Toolbar>
                            <IconButton
                                edge="start"
                                className={ clsx(classes.menuButton, !small && this.state.drawerOpen && classes.hide) }
                                onClick={ () => this.handleDrawerOpen() }
                            >
                                <MenuIcon />
                            </IconButton>
                            <IconButton>
                                <VisibilityIcon />
                            </IconButton>
                            <IconButton>
                                <BuildIcon />
                            </IconButton>
                            <IconButton onClick={ () => this.toggleTheme() }>
                                { this.state.themeName === 'dark' &&
                                    <Brightness4Icon />
                                }
                                { this.state.themeName === 'blue' &&
                                    <Brightness5Icon />
                                }
                                { this.state.themeName === 'colored' &&
                                    <Brightness6Icon />
                                }
                                { this.state.themeName === 'light' &&
                                    <Brightness7Icon />
                                }
                            </IconButton>
                            {/*This will be removed later to settings, to not allow so easy to enable it*/}
                            <IconButton
                                onClick={ () => {
                                    window.localStorage.setItem('App.expertMode', !this.state.expertMode);
                                    this.setState({expertMode: !this.state.expertMode});
                                }}
                                color={ this.state.expertMode ? 'secondary' : 'default' }
                            >
                                <ExpertIcon
                                    title={ I18n.t('Toggle expert mode')}
                                    glowColor={ this.getTheme().palette.secondary.main }
                                    active={ this.state.expertMode }
                                    className={ clsx(classes.expertIcon, this.state.expertMode && classes.expertIconActive)}
                                />
                            </IconButton>

                            <Typography variant="h6" className={classes.title} style={{flexGrow: 1}}>
                            </Typography>
                            <Grid container spacing={ 1 } alignItems="center" style={{width: 'initial'}}>
                                <Grid item>
                                    <Typography>admin</Typography>
                                </Grid>
                                <Grid item>
                                    <Avatar className={ clsx((this.state.themeName === 'colored' || this.state.themeName === 'blue') && classes.logoWhite) } alt="ioBroker" src="img/no-image.png" />
                                </Grid>
                            </Grid>
                        </Toolbar>
                    </AppBar>
                    <Drawer
                        open={ this.state.drawerOpen }
                        onClose={ () => this.handleDrawerClose() }
                        onOpen={ () => this.handleDrawerOpen() }
                    >
                        { this.getNavigationItems() }
                    </Drawer>
                    <Paper
                        elevation={ 0 }
                        square
                        className={
                            clsx(classes.content, {
                                [classes.contentMargin]: !small,
                                [classes.contentShift]: !small && this.state.drawerOpen
                            })
                        }
                    >
                        { this.getCurrentTab() }
                    </Paper>
                    <Snackbar open={ this.state.alert } autoHideDuration={ 6000 } onClose={ () => this.handleAlertClose() }>
                        <Alert onClose={ () => this.handleAlertClose() } variant="filled" severity={ this.state.alertType }>
                            { this.state.alertMessage }
                        </Alert>
                    </Snackbar>
                </Paper>
                { !this.state.connected && <Connecting /> }
            </ThemeProvider>
        );
    }
}

export default withWidth()(withStyles(styles)(App));