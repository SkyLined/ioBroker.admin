import React from 'react';
import {
    Button,
    Dialog, DialogActions, DialogContent,
    DialogTitle, MenuItem, Select, Typography,
} from '@mui/material';

import { Close as CloseIcon } from '@mui/icons-material';

import {
    type AdminConnection, I18n, IconCopy as SaveIcon,
} from '@iobroker/adapter-react-v5';
import IsVisible from '@/components/IsVisible';

interface AutoUpgradeConfigDialogProps {
    /** Called when user closes dialog */
    onClose: () => void;
    /** The socket connection */
    socket: AdminConnection;
    /** The host id of the host to upgrade node.js on */
    hostId: string;
    /** Name of the adapter */
    adapter: string;
}

/** All possible auto upgrade settings */
const AUTO_UPGRADE_SETTINGS: ioBroker.AutoUpgradePolicy[] = ['none', 'patch', 'minor', 'major'];

interface AutoUpgradeConfigDialogState {
    /** Auto upgrade policy which is currently saved */
    currentSavedPolicy: ioBroker.AutoUpgradePolicy;
    /** The current configured auto upgrade policy */
    policy: ioBroker.AutoUpgradePolicy;
    /** The repositories the config applies for */
    repositories: string[];
    /** If the feature is supported */
    supported: boolean;
}

export default class AutoUpgradeConfigDialog extends React.Component<AutoUpgradeConfigDialogProps, AutoUpgradeConfigDialogState> {
    constructor(props: AutoUpgradeConfigDialogProps) {
        super(props);

        this.state = {
            currentSavedPolicy: 'none',
            policy: 'none',
            repositories: [],
            supported: true,
        };
    }

    /**
     * Lifecycle hook called if component is mounted
     */
    async componentDidMount(): Promise<void> {
        await this.getConfiguredRepositories();
        await this.getCurrentAutoUpgradeSetting();
    }

    async getConfiguredRepositories(): Promise<void> {
        const sysConfig = await this.props.socket.getObject('system.config');

        if (!sysConfig?.common?.adapterAutoUpgrade) {
            return;
        }

        const activeRepos = Object.entries(sysConfig.common.adapterAutoUpgrade.repositories)
            .filter(([, active]) => active).map(([repoName]) => repoName);

        this.setState({ repositories: activeRepos });
    }

    /**
     * Render the element
     */
    render(): React.JSX.Element {
        return (
            <Dialog open={!0} maxWidth="lg" fullWidth>
                <DialogTitle>{I18n.t('Auto upgrade policy for %s', this.props.adapter)}</DialogTitle>
                <DialogContent style={{ height: 150, padding: '0 20px', overflow: 'hidden' }}>
                    <IsVisible value={!this.state.supported}>
                        <Typography>{I18n.t('This feature is supported up from js-controller Kiera (Version 6)!')}</Typography>
                    </IsVisible>
                    <IsVisible value={this.state.supported}>
                        <Typography>{I18n.t('Allow only the following upgrades to be performed automatically:')}</Typography>
                        <Select sx={{ height: 40 }} value={this.state.policy} onChange={e => this.setState({ policy: e.target.value as ioBroker.AutoUpgradePolicy })}>
                            {AUTO_UPGRADE_SETTINGS.map(
                                option => <MenuItem value={option}>{option}</MenuItem>,
                            )}
                        </Select>
                        <IsVisible value={this.state.repositories.includes('beta') && this.state.policy !== 'none'}>
                            <Typography sx={{ color: 'red' }}>{I18n.t('You have configured to run automatic upgrades for the "beta" repository, be aware that if the beta repository is active this adapter will pull in beta updates automatically according to this configuration!')}</Typography>
                        </IsVisible>
                        <IsVisible value={this.state.policy === 'major'}>
                            <Typography sx={{ color: 'red' }}>{I18n.t('The current selected configuration will allow to automatically pull in incompatible changes of this adapter!')}</Typography>
                        </IsVisible>
                    </IsVisible>
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={this.state.currentSavedPolicy === this.state.policy}
                        color="primary"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => this.save()}
                    >
                        {I18n.t('Save')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            this.props.onClose();
                        }}
                        color="primary"
                        startIcon={<CloseIcon />}
                    >
                        {I18n.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    /**
     * Get id of the adapter object
     */
    private getAdapterId(): string {
        return `${this.props.hostId}.adapter.${this.props.adapter}`;
    }

    /**
     * Get the current auto upgrade setting
     */
    async getCurrentAutoUpgradeSetting(): Promise<void> {
        const obj = await this.props.socket.getObject(this.getAdapterId()) as ioBroker.AdapterObject;

        if (!obj) {
            console.error('no adapter object existing');
            this.setState({ supported: false });
            return;
        }

        this.setState({ policy: obj.common.automaticUpgrade, currentSavedPolicy: obj.common.automaticUpgrade });
    }

    /**
     * Save the current setting to the adapter object
     */
    async save(): Promise<void> {
        const obj = await this.props.socket.getObject(this.getAdapterId()) as ioBroker.AdapterObject;

        if (!obj) {
            console.error('no adapter object existing');
            this.setState({ supported: false });
            return;
        }

        obj.common.automaticUpgrade = this.state.policy;
        await this.props.socket.setObject(this.getAdapterId(), obj);
        this.setState({ currentSavedPolicy: this.state.policy });
    }
}
