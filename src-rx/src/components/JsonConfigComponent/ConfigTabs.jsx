import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import ConfigGeneric from './ConfigGeneric';
import ConfigPanel from './ConfigPanel';

const styles = theme => ({
    tabs: {
        height: '100%',
        width: '100%',
    },
    panel: {
        height: 'calc(100% - 48px)',
        width: '100%',
        display: 'block'
    }
});

class ConfigTabs extends ConfigGeneric {
    constructor(props) {
        super(props);

        let tab = window.localStorage.getItem((this.props.dialogName || 'App') + '.' + this.props.adapterName) || Object.keys(this.props.schema.items)[0];
        if (!Object.keys(this.props.schema.items).includes(tab)) {
            tab = Object.keys(this.props.schema.items)[0];
        }
        this.state = {
            tab,
            hidden: [],
        };
    }

    onHiddenChanged = (name, isHidden) => {
        const pos = this.state.hidden.indexOf(name);
        if (isHidden && pos === -1) {
            const hidden = [...this.state.hidden];
            hidden.push(name);
            this.setState({ hidden });
        } else
        if (!isHidden && pos !== -1) {
            const hidden = [...this.state.hidden];
            hidden.splice(pos, 1);
            this.setState({ hidden });
        }
    };

    render() {
        const items = this.props.schema.items;

        return <div className={this.props.classes.tabs}>
            <Tabs value={this.state.tab} onChange={(e, tab) => {
                window.localStorage.setItem((this.props.dialogName || 'App') + '.' + this.props.adapterName, tab);
                this.setState({tab});
            }}>
                {Object.keys(items).filter(name => !this.state.hidden.includes(name)).map(name => {
                    let disabled;
                    if (this.props.custom) {
                        const hidden = this.executeCustom(items[name].hidden, this.props.data, this.props.customObj, this.props.instanceObj);
                        if (hidden) {
                            return null;
                        }
                        disabled = this.executeCustom(items[name].disabled, this.props.data, this.props.customObj, this.props.instanceObj);
                    } else {
                        const hidden = this.execute(items[name].hidden, false);
                        if (hidden) {
                            return null;
                        }
                        disabled = this.execute(items[name].disabled, false);
                    }
                    return <Tab wrapped disabled={disabled} key={name} value={name} label={this.getText(items[name].label)} />
                })}
            </Tabs>
            {<ConfigPanel
                key={this.state.tab}
                index={1001}
                isParentTab={true}
                onCommandRunning={this.props.onCommandRunning}
                commandRunning={this.props.commandRunning}
                className={this.props.classes.panel}
                socket={this.props.socket}
                adapterName={this.props.adapterName}
                instance={this.props.instance}
                common={this.props.common}
                customs={this.props.customs}
                alive={this.props.alive}
                themeType={this.props.themeType}
                themeName={this.props.themeName}
                data={this.props.data}
                originalData={this.props.originalData}
                systemConfig={this.props.systemConfig}
                onError={this.props.onError}
                onChange={this.props.onChange}
                multiEdit={this.props.multiEdit}
                onHidden={this.onHiddenChanged}

                forceUpdate={this.props.forceUpdate}
                registerOnForceUpdate={this.props.registerOnForceUpdate}

                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}
                custom={this.props.custom}

                schema={items[this.state.tab]}
            />}
        </div>;
    }
}

ConfigTabs.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    originalData: PropTypes.object,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    customs: PropTypes.object,
    adapterName: PropTypes.string,
    instance: PropTypes.number,
    commandRunning: PropTypes.bool,
    onCommandRunning: PropTypes.func,
    dateFormat: PropTypes.string,
    isFloatComma: PropTypes.bool,
    multiEdit: PropTypes.bool,

    customObj: PropTypes.object,
    instanceObj: PropTypes.object,
    custom: PropTypes.bool,

    registerOnForceUpdate: PropTypes.func.isRequired,
    forceUpdate: PropTypes.func.isRequired,
    systemConfig: PropTypes.object,
    alive: PropTypes.bool,
    common: PropTypes.object,
};

export default withStyles(styles)(ConfigTabs);