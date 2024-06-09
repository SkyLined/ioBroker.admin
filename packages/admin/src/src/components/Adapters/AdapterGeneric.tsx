import React from 'react';
import AutoUpgradeConfigDialog from '@/dialogs/AutoUpgradeConfigDialog';
import semver from 'semver';

import { green, red } from '@mui/material/colors';

import {
    CardMedia,
    IconButton, Tooltip,
    Typography, Rating, Grid,
    Link, TextField,
    InputAdornment, Button, Card, CardContent,
} from '@mui/material';

import {
    Refresh as RefreshIcon,
    Add as AddIcon,
    Help as HelpIcon,
    KeyboardArrowUp as UpdateSettingsIcon,
    Cloud as CloudIcon,
    CloudOff as CloudOffIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Remove as RemoveIcon,
    GitHub as GitHubIcon,
    MonetizationOn,
    Close as CloseIcon,
    Link as LinkIcon,
    Publish as PublishIcon,
    DeleteForever as DeleteForeverIcon,
    AddToPhotos as AddToPhotosIcon, Build as BuildIcon,
} from '@mui/icons-material';

import { type IobTheme, Utils } from '@iobroker/adapter-react-v5';

import AdapterUpdateDialog from '@/dialogs/AdapterUpdateDialog';
import CustomModal from '@/components/CustomModal';
import RatingDialog, { type RatingDialogRepository } from '@/dialogs/RatingDialog';
import AdapterDeletionDialog from '@/dialogs/AdapterDeletionDialog';
import BasicUtils from '@/Utils';
import AdminUpdater from '@/dialogs/AdminUpdater';
import AdapterInstallDialog, {
    type AdapterInstallDialogProps,
    type AdapterInstallDialogState,
    type AdapterRating,
    type AdapterRatingInfo,
    type AdaptersContext,
} from '@/components/Adapters/AdapterInstallDialog';
import sentryIcon from '../../assets/sentry.svg';
import IsVisible from '../IsVisible';

export const genericStyle = (theme: IobTheme): Record<string, any> => ({
    hidden: {
        display: 'none',
    },
    buttonUpdate: {
        border: '1px solid',
        padding: '0px 7px',
        borderRadius: 5,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background 0.5s',
        '&:hover': {
            background: '#00800026',
        },
    },

    buttonUpdateIcon: {
        height: 20,
        width: 20,
        marginRight: 10,
    },

    classPoll: {
        color: 'orange',
    },
    classPush: {
        color: 'green',
    },
    classAssumption: {
        color: 'red',
        transform: 'rotate(90deg)',
    },
    marginLeft5: {
        marginLeft: 5,
    },
    ratingSet: {
        cursor: 'pointer',
    },
    sentry: {
        width: 21,
        height: 21,
        objectFit: 'fill',
        marginTop: 3,
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-260deg) brightness(99%) contrast(97%)',
    },
    tooltip: {
        pointerEvents: 'none',
    },
    wrongDependencies: {
        color: red[700],
    },
    updateAvailable: {
        color: green[700],
    },
    currentVersion: {
        cursor: 'pointer',
        marginBottom: 6,
        marginRight: 8,
        marginTop: 4,
        '&:hover': {
            background: theme.palette.primary.dark,
        },
    },
    header: {
        fontWeight: 'bold',
        background: theme.palette.secondary.main,
        padding: 10,
    },
    modalDialog: {
        height: 'calc(100% - 64px)',
        overflowY: 'hidden',
    },
    currentVersionText: {
        color: theme.palette.mode === 'dark' ? '#a3ffa3' : '#009800',
        fontWeight: 'bold',
    },
});

export type Ratings = { [adapterName: string]: AdapterRating } & { uuid: string };

export type AdapterCacheEntry = {
    title: string;
    desc: string;
    image: string;
    connectionType: string;
    updateAvailable: boolean;
    rightDependencies: boolean;
    rightOs: boolean;
    sentry: boolean;
    daysAgo: number;
    stat: number;
    daysAgoText: string;
};

export interface AdapterGenericProps extends AdapterInstallDialogProps {
    classes: Record<string, string>;
    /** adapter name id without 'system.adapter.' */
    adapterName: string;
    /** Same information for every adapter */
    context: AdaptersContext;
    cached: AdapterCacheEntry;
}

export interface AdapterGenericState extends AdapterInstallDialogState {
    autoUpgradeDialogOpen: boolean;
    showUpdateDialog: boolean;
    adapterDeletionDialog: boolean;
    adminUpgradeTo: string;
    adapterInstallSpecificVersion: string;
    showInstallVersion: boolean;
    showSetRating: {
        version: string;
        rating: AdapterRatingInfo;
    } | null;
}

export interface ImageProps {
    alt: string;
    style: React.CSSProperties;
    [other: string]: any;
}

export default abstract class AdapterGeneric<TProps extends AdapterGenericProps, TState extends AdapterGenericState> extends AdapterInstallDialog<TProps, TState> {
    protected installedVersion: string = '';

    public constructor(props: TProps) {
        super(props);

        Object.assign(this.state, {
            autoUpgradeDialogOpen: false,
            showUpdateDialog: false,
            adapterDeletionDialog: false,
            adminUpgradeTo: '',
            adapterInstallSpecificVersion: '',
            showInstallVersion: false,
            showSetRating: null,
        } as TState);
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderImage(imageProps: ImageProps): React.JSX.Element {
        const {
            style, alt, ...other
        } = imageProps;

        const img = style.backgroundImage.substring(5, style.backgroundImage.length - 2);

        return <img
            {...other}
            alt={alt}
            src={img}
            onError={e => {
                if (e.target) {
                    // @ts-expect-error check later
                    e.target.onerror = null;
                    // @ts-expect-error check later
                    e.target.src = './img/no-image.png';
                }
            }}
        />;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderAddInstanceButton() {
        const allowAdapterInstall = this.props.context.repository[this.props.adapterName] ? this.props.context.repository[this.props.adapterName].allowAdapterInstall : true;

        return <IsVisible value={allowAdapterInstall}>
            <Tooltip title={this.props.context.t('Add instance')} classes={{ popper: this.props.classes.tooltip }}>
                <IconButton
                    size="small"
                    disabled={this.props.context.commandRunning}
                    className={!this.props.cached.rightOs ? this.props.classes.hidden : ''}
                    onClick={this.props.cached.rightOs ? () => this.onAddInstance(this.props.adapterName, this.props.context) : undefined}
                >
                    <AddIcon />
                </IconButton>
            </Tooltip>
        </IsVisible>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderAutoUpgradeButton() {
        if (!this.installedVersion) {
            return null;
        }
        return <Tooltip title={this.props.context.t('Automatic Upgrade Policy')} classes={{ popper: this.props.classes.tooltip }}>
            <IconButton
                size="small"
                onClick={() => this.setState({ autoUpgradeDialogOpen: true, showDialog: true })}
            >
                <UpdateSettingsIcon />
            </IconButton>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderReadmeButton() {
        const allowAdapterReadme = this.props.context.repository[this.props.adapterName] ? this.props.context.repository[this.props.adapterName].allowAdapterReadme : true;

        return <IsVisible value={allowAdapterReadme}>
            <Tooltip title={this.props.context.t('Readme')} classes={{ popper: this.props.classes.tooltip }}>
                <IconButton
                    size="small"
                    onClick={() => this.openInfoDialog()}
                >
                    <HelpIcon />
                </IconButton>
            </Tooltip>
        </IsVisible>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderRating() {
        const allowAdapterRating = this.props.context.repository[this.props.adapterName] ? this.props.context.repository[this.props.adapterName].allowAdapterRating : true;

        if (this.props.context.isTileView && (this.props.context.sortPopularFirst || this.props.context.sortRecentlyUpdated)) {
            return null;
        }

        const stat = this.props.context.repository[this.props.adapterName].stat;
        if (!stat || allowAdapterRating === false) {
            return null;
        }

        return <div
            onClick={() => this.setState({
                showSetRating: {
                    version: this.installedVersion,
                    rating: this.props.context.repository[this.props.adapterName].rating,
                },
                showDialog: true,
            })}
            className={Utils.clsx(this.props.classes.rating, this.props.classes.ratingSet)}
            title={this.props.context.repository[this.props.adapterName].rating?.title}
        >
            <Rating
                name={this.props.adapterName}
                precision={0.5}
                size="small"
                readOnly
                value={this.props.context.repository[this.props.adapterName].rating?.rating?.r || 0}
            />
        </div>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderConnectionType() {
        const connectionType = this.props.context.repository[this.props.adapterName]?.connectionType;
        return connectionType === 'cloud' ?
            <Tooltip
                title={this.props.context.t('Adapter requires the specific cloud access for these devices/service')}
                classes={{ popper: this.props.classes.tooltip }}
            >
                <CloudIcon />
            </Tooltip> :
            (connectionType === 'local' ?
                <Tooltip
                    title={this.props.context.t('Adapter does not use the cloud for these devices/service')}
                    classes={{ popper: this.props.classes.tooltip }}
                >
                    <CloudOffIcon />
                </Tooltip> : <CloudOffIcon opacity={0} />);
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderDataSource() {
        const dataSource = this.props.context.repository[this.props.adapterName]?.dataSource;
        return dataSource ? <div className={this.props.classes.marginLeft5}>
            {(dataSource === 'poll' ?
                <Tooltip title={this.props.context.t('The device or service will be periodically asked')} classes={{ popper: this.props.classes.tooltip }}>
                    <ArrowUpwardIcon className={this.props.classes.classPoll} />
                </Tooltip> :
                dataSource === 'push' ?
                    <Tooltip title={this.props.context.t('The device or service delivers the new state actively')} classes={{ popper: this.props.classes.tooltip }}>
                        <ArrowDownwardIcon className={this.props.classes.classPush} />
                    </Tooltip> :
                    dataSource === 'assumption' ?
                        <Tooltip
                            classes={{ popper: this.props.classes.tooltip }}
                            title={this.props.context.t('Adapter cannot request the exactly device status and the status will be guessed on the last sent command')}
                        >
                            <RemoveIcon className={this.props.classes.classAssumption} />
                        </Tooltip> : null)}
        </div> : null;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderLicenseInfo() {
        const adapter = this.props.context.repository[this.props.adapterName];

        return <Link
            href={adapter.licenseInformation?.link}
            target="_blank"
            rel="noopener"
            sx={{ color: 'black', '&:hover': { color: 'black' } }}
        >
            {adapter.licenseInformation?.type === 'paid' ?
                <Tooltip title={this.props.context.t('The adapter requires a paid license.')} classes={{ popper: this.props.classes.tooltip }}>
                    <MonetizationOn />
                </Tooltip>
                : adapter.licenseInformation?.type === 'commercial' ?
                    <Tooltip
                        classes={{ popper: this.props.classes.tooltip }}
                        title={this.props.context.t('The adapter requires a paid license for commercial use.')}
                    >
                        <MonetizationOn opacity={0.5} />
                    </Tooltip>
                    : adapter.licenseInformation?.type === 'limited' ?
                        <Tooltip
                            classes={{ popper: this.props.classes.tooltip }}
                            title={this.props.context.t('The adapter has a limited functionality without a paid license.')}
                        >
                            <MonetizationOn opacity={0.5} />
                        </Tooltip> :
                        <MonetizationOn opacity={0} />}
        </Link>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderSentryInfo() {
        const sentry = this.props.context.repository[this.props.adapterName]?.plugins?.sentry;

        return sentry ? <div className={this.props.classes.marginLeft5}>
            <Tooltip title="sentry" classes={{ popper: this.props.classes.tooltip }}>
                <CardMedia
                    className={this.props.classes.sentry}
                    component="img"
                    image={sentryIcon}
                />
            </Tooltip>
        </div> : null;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderVersion() {
        const allowAdapterUpdate = this.props.context.repository[this.props.adapterName] ? this.props.context.repository[this.props.adapterName].allowAdapterUpdate : true;

        return !this.props.context.commandRunning && this.props.cached.updateAvailable && allowAdapterUpdate ? <Tooltip title={this.props.context.t('Update')} classes={{ popper: this.props.classes.tooltip }}>
            <div
                onClick={() => this.setState({ showUpdateDialog: true, showDialog: true })}
                className={Utils.clsx(this.props.classes.buttonUpdate, this.props.cached.rightDependencies && this.props.classes.updateAvailable)}
            >
                <IconButton
                    className={this.props.classes.buttonUpdateIcon}
                    size="small"
                >
                    <RefreshIcon />
                </IconButton>
                {this.props.context.repository[this.props.adapterName].version}
            </div>
        </Tooltip> : <span className={this.props.cached.rightDependencies ? '' : this.props.classes.wrongDependencies}>{this.props.context.repository[this.props.adapterName].version}</span>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderInstalledVersion(isRow?: boolean) {
        const installed = this.props.context.installed[this.props.adapterName];
        const installedFrom = installed?.installedFrom;
        const {
            adapterName,
            classes,
        } = this.props;

        if (isRow) {
            const enabledCount = installed?.enabled;
            const installedCount = installed?.count;

            return <Grid
                container
                wrap="nowrap"
                alignItems="center"
                spacing={1}
            >
                {this.installedVersion ? <Grid item>
                    {this.installedVersion + (installedCount ? ` (${installedCount}${installedCount !== enabledCount ? '~' : ''})` : '')}
                </Grid> : null}
                {installedFrom && !installedFrom.startsWith(`iobroker.${adapterName}@`) && <Grid item container>
                    <Tooltip title={this.props.context.t('Non-NPM-Version: ') + installedFrom} classes={{ popper: this.props.classes.tooltip }}>
                        <GitHubIcon
                            fontSize="small"
                            className={classes.versionWarn}
                        />
                    </Tooltip>
                </Grid>}
            </Grid>;
        }

        return this.installedVersion ? <Typography component="span" className={this.props.classes.cardContentFlexBetween}>
            <div>
                {this.props.context.t('Installed version')}
                :
            </div>
            <div className={classes.cardContentFlex}>
                {installedFrom && !installedFrom.startsWith(`iobroker.${adapterName}@`) &&
                    <Tooltip title={this.props.context.t('Non-NPM-Version: ') + installedFrom} classes={{ popper: classes.tooltip }}>
                        <GitHubIcon
                            fontSize="small"
                            className={classes.versionWarn}
                        />
                    </Tooltip>}
                {this.installedVersion}
            </div>
        </Typography> : null;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderUploadButton() {
        return this.props.context.expertMode && this.installedVersion && <Tooltip title={this.props.context.t('Upload')} classes={{ popper: this.props.classes.tooltip }}>
            <IconButton
                size="small"
                disabled={this.props.context.commandRunning}
                onClick={this.onUpload}
            >
                <PublishIcon />
            </IconButton>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderDeleteButton() {
        const allowAdapterDelete = this.props.context.repository[this.props.adapterName] ? this.props.context.repository[this.props.adapterName].allowAdapterDelete : true;

        return <IsVisible value={!!this.installedVersion && allowAdapterDelete}>
            <Tooltip title={this.props.context.t('Delete adapter')} classes={{ popper: this.props.classes.tooltip }}>
                <IconButton
                    size="small"
                    disabled={this.props.context.commandRunning}
                    onClick={() => this.setState({ adapterDeletionDialog: true, showDialog: true })}
                >
                    <DeleteForeverIcon />
                </IconButton>
            </Tooltip>
        </IsVisible>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderInstallSpecificVersionButton() {
        const allowAdapterUpdate = this.props.context.repository[this.props.adapterName] ? this.props.context.repository[this.props.adapterName].allowAdapterUpdate : true;

        return this.props.context.expertMode && allowAdapterUpdate !== false && this.installedVersion && <Tooltip title={this.props.context.t('Install a specific version')} classes={{ popper: this.props.classes.tooltip }}>
            <IconButton
                disabled={this.props.context.commandRunning}
                size="small"
                onClick={() => this.setState({ showInstallVersion: true, showDialog: true })}
            >
                <AddToPhotosIcon />
            </IconButton>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderRebuildButton() {
        if (!this.props.context.expertMode || !this.installedVersion) {
            return null;
        }
        return <Tooltip title={this.props.context.t('Rebuild')}>
            <IconButton
                size="small"
                disabled={this.props.context.commandRunning}
                onClick={() => this.rebuild()}
            >
                <BuildIcon />
            </IconButton>
        </Tooltip>;
    }

    renderAutoUpdateDialog() {
        if (!this.state.autoUpgradeDialogOpen) {
            return null;
        }
        return <AutoUpgradeConfigDialog
            onClose={() => this.setState({ autoUpgradeDialogOpen: false, showDialog: false })}
            adapter={this.props.adapterName}
            hostId={this.props.context.adminHost}
            socket={this.props.context.socket}
        />;
    }

    renderUpdateAdapterDialog() {
        if (!this.state.showUpdateDialog) {
            return null;
        }

        return <AdapterUpdateDialog
            adapter={this.props.adapterName}
            adapterObject={this.props.context.repository[this.props.adapterName]}
            t={this.props.context.t}
            dependencies={this.getDependencies(this.props.adapterName, this.props.context)}
            rightDependencies={this.props.context.rightDependenciesFunc(this.props.adapterName)}
            news={this.getNews()}
            toggleTranslation={this.props.context.toggleTranslation}
            noTranslation={this.props.context.noTranslation}
            installedVersion={this.installedVersion}
            onUpdate={version => this.setState({ showUpdateDialog: false, showDialog: false }, () => this.update(version))}
            onIgnore={ignoreVersion => this.setState({ showUpdateDialog: false, showDialog: false }, () =>
                this.props.context.socket
                    .getObject(`system.adapter.${this.props.adapterName}`)
                    .then(obj => {
                        if (obj?.common) {
                            (obj.common as ioBroker.AdapterCommon).ignoreVersion = ignoreVersion;
                            this.props.context.socket.setObject(obj._id, obj)
                                .catch(error => window.alert(`Cannot write object: ${error}`));
                        } else {
                            window.alert(`Adapter "${this.props.adapterName}" does not exist!`);
                        }
                    })
                    .then(() => this.props.context.removeUpdateAvailable(this.props.adapterName)))}
            onClose={() => this.setState({ showUpdateDialog: false, showDialog: false })}
            instances={this.props.context.compactInstances}
        />;
    }

    static formatNews(news: string) {
        const lines = (news || '')
            .toString()
            .split('\n')
            .map(line =>
                line.trim().replace(/^\*+/, '').replace(/^-/, '').replace(/\*+$/, '')
                    .replace(/\r/g, '')
                    .trim())
            .filter(line => line);

        return lines.map((line, index) =>
            <div style={{ }} key={index}>
                <span>- </span>
                {line}
            </div>);
    }

    renderAdapterInstallVersion() {
        if (!this.state.showInstallVersion) {
            return null;
        }

        return <CustomModal
            title={this.props.context.t('Please select specific version of %s', this.props.adapterName)}
            applyButton={false}
            onClose={() => this.setState({
                showInstallVersion: false,
                adapterInstallSpecificVersion: '',
                showDialog: false,
            })}
            classes={{ modalDialog: this.props.classes.modalDialog }}
            toggleTranslation={this.props.context.toggleTranslation}
            noTranslation={this.props.context.noTranslation}
        >
            <div style={{ height: '100%', overflowY: 'hidden' }}>
                <div className={this.props.classes.containerSpecificVersion}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TextField
                            variant="standard"
                            style={{ flexGrow: 1 }}
                            label={this.props.context.t('Enter version manually')}
                            value={this.state.adapterInstallSpecificVersion}
                            onChange={event =>
                                this.setState({ adapterInstallSpecificVersion: event.target.value })}
                            InputProps={{
                                endAdornment: this.state.adapterInstallSpecificVersion ? <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => this.setState({ adapterInstallSpecificVersion: '' })}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </InputAdornment> : null,
                            }}
                        />
                        <Button
                            color="primary"
                            variant="contained"
                            size="small"
                            disabled={!this.state.adapterInstallSpecificVersion}
                            onClick={() => {
                                if (this.state.adapterInstallSpecificVersion) {
                                    this.update(this.state.adapterInstallSpecificVersion);
                                    this.setState({
                                        showInstallVersion: false,
                                        adapterInstallSpecificVersion: '',
                                        showDialog: false,
                                    });
                                }
                            }}
                        >
                            {this.props.context.t('Install')}
                        </Button>
                    </div>
                    <Tooltip title={this.props.context.t('npmjs.com')} classes={{ popper: this.props.classes.tooltip }}>
                        <IconButton
                            size="small"
                            onClick={() => {
                                window.open(`https://www.npmjs.com/package/iobroker.${this.props.adapterName}?activeTab=versions`, this.props.adapterName).focus();
                            }}
                        >
                            <LinkIcon />
                        </IconButton>
                    </Tooltip>
                </div>
                <div className={this.props.classes.header}>{this.props.context.t('Or select from the list')}</div>
                <div
                    className={this.props.classes.containerVersion}
                    style={{ height: 'calc(100% - 122px)', overflowY: 'auto' }}
                >
                    {this.getNews(true).map(({ version, news }) => <Card
                        variant="outlined"
                        key={version}
                        className={this.props.classes.currentVersion}
                        onClick={() => {
                            this.update(version);
                            this.setState({ showInstallVersion: false, showDialog: false });
                        }}
                    >
                        <CardContent>
                            <Typography
                                sx={{
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                }}
                                color="text.secondary"
                                className={this.installedVersion === version ? this.props.classes.currentVersionText : ''}
                                gutterBottom
                            >
                                {version}
                                {this.installedVersion === version ?
                                    <span className={this.props.classes.currentVersionText}>{`(${this.props.context.t('current')})`}</span> : ''}
                            </Typography>
                            <Typography variant="body2" style={{ opacity: 0.7 }}>
                                {AdapterGeneric.formatNews(news)}
                            </Typography>
                        </CardContent>
                    </Card>)}
                </div>
            </div>
        </CustomModal>;
    }

    renderSetRatingDialog() {
        if (!this.state.showSetRating) {
            return null;
        }
        return <RatingDialog
            t={this.props.context.t}
            lang={this.props.context.lang}
            version={this.state.showSetRating.version}
            adapter={this.props.adapterName}
            currentRating={this.state.showSetRating.rating}
            onClose={(update: RatingDialogRepository) => {
                if (update) {
                    this.props.context.updateRating(this.props.adapterName, update);
                }
                this.setState({ showSetRating: null, showDialog: false });
            }}
            uuid={this.props.context.uuid}
        />;
    }

    /**
     * Perform the Admin Upgrade via Webserver
     * This allows showing UI progress even admin is down
     */
    renderWebserverUpgrade() {
        if (!this.state.adminUpgradeTo) {
            return null;
        }

        return <AdminUpdater
            socket={this.props.context.socket}
            themeType={this.props.context.themeType}
            host={this.props.context.adminHost}
            onClose={() => this.setState({ adminUpgradeTo: '', showDialog: false })}
            version={this.state.adminUpgradeTo}
            adminInstance={this.props.context.adminInstance}
            onUpdating={isUpdating => this.props.context.onUpdating(isUpdating)}
        />;
    }

    renderAdapterDeletionDialog() {
        if (!this.state.adapterDeletionDialog) {
            return null;
        }
        return <AdapterDeletionDialog
            adapter={this.props.adapterName}
            socket={this.props.context.socket}
            t={this.props.context.t}
            onClick={deleteCustom => this.delete(deleteCustom)}
            onClose={() => this.setState({ adapterDeletionDialog: false, showDialog: false })}
        />;
    }

    /**
     * Open adapter readme or docs
     */
    openInfoDialog() {
        const adapter = this.props.context.repository[this.props.adapterName];
        const lang = adapter.docs?.[this.props.context.lang] ? this.props.context.lang : 'en';

        window.open(BasicUtils.getDocsLinkForAdapter({ lang, adapterName: this.props.adapterName }), 'help');
    }

    getNews(all = false): { version: string; news: string }[] {
        const adapter = this.props.context.repository[this.props.adapterName];
        const installed = this.props.context.installed[this.props.adapterName];
        const news: { version: string; news: string }[] = [];

        if (installed && adapter?.news) {
            Object.keys(adapter.news).forEach(version => {
                try {
                    if (semver.gt(version, installed.version) || all) {
                        let text: string;
                        if (typeof adapter.news[version] === 'object') {
                            text = this.props.context.noTranslation
                                ? adapter.news[version].en
                                : (adapter.news[version][this.props.context.lang] || adapter.news[version].en);
                        } else {
                            // @ts-expect-error deprecated
                            text = adapter.news[version] as string;
                        }

                        news.push({
                            version,
                            news: text,
                        });
                    }
                } catch (e) {
                    // ignore it
                    console.warn(`[ADAPTERS] Cannot compare "${version}" and "${installed.version}" (${this.props.adapterName})`);
                }
            });
        }

        return news;
    }

    onUpload() {
        const adapter = this.props.context.repository[this.props.adapterName];
        // @ts-expect-error licenseUrl is deprecated
        let url = adapter.licenseUrl || adapter.licenseInformation?.link || adapter.extIcon || '';
        if (url.includes('/main')) {
            url = `${url.split('/main')[0]}/main/LICENSE`;
        } else {
            url = `${url.split('/master')[0]}/master/LICENSE`;
        }

        const license = adapter.licenseInformation?.license || adapter.license;

        if (license !== 'MIT') {
            this.setState({ showLicenseDialog: { url, upload: true, adapterName: this.props.adapterName }, showDialog: true });
        } else {
            this.upload(this.props.adapterName, this.props.context);
        }
    }

    delete(deleteCustom?: boolean) {
        this.props.context.executeCommand(
            `del ${this.props.adapterName}${deleteCustom ? ' --custom' : ''}${this.props.context.expertMode ? ' --debug' : ''}`,
        );
    }

    async update(version: string) {
        if (this.props.adapterName === 'admin' && this.props.context.adminHost === this.props.context.currentHost && (await this.props.context.socket.checkFeatureSupported('ADAPTER_WEBSERVER_UPGRADE'))) {
            this.setState({ adminUpgradeTo: version, showDialog: true });
            return;
        }

        this.props.context.executeCommand(`upgrade ${this.props.adapterName}@${version}${this.props.context.expertMode ? ' --debug' : ''}`);
    }

    rebuild() {
        this.props.context.executeCommand(`rebuild ${this.props.adapterName}${this.props.context.expertMode ? ' --debug' : ''}`);
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderDialogs() {
        if (!this.state.showDialog) {
            return null;
        }

        return <>
            {this.renderAddInstanceDialog(this.props.context)}
            {this.renderLicenseDialog(this.props.context)}
            {this.renderUpdateAdapterDialog()}
            {this.renderAdapterInstallVersion()}
            {this.renderSetRatingDialog()}
            {this.renderAdapterDeletionDialog()}
            {this.renderWebserverUpgrade()}
            {this.renderAutoUpdateDialog()}
        </>;
    }
}
