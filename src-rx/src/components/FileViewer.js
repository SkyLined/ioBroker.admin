import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';

import NoImage from '@iobroker/adapter-react/assets/no_icon.svg';
import Utils from '@iobroker/adapter-react/Components/Utils';

// Icons
import { FaCopy as CopyIcon } from 'react-icons/fa';
import Brightness5Icon from '@material-ui/icons/Brightness6';
import CloseIcon from '@material-ui/icons/Close';
import clsx from 'clsx';
import { IconButton } from '@material-ui/core';

const styles = theme => ({
    dialog: {
        height: '100%',
    },
    paper: {
        height: 'calc(100% - 64px)',
    },
    content: {
        textAlign: 'center',
    },
    textarea: {
        width: '100%',
        height: '100%',
    },
    img: {
        width: 'auto',
        height: 'calc(100% - 5px)',
        objectFit: 'contain',
    },
    dialogTitle: {
        justifyContent: 'space-between',
        display: 'flex'
    }
});

export const EXTENSIONS = {
    images: ['png', 'jpg', 'svg', 'jpeg', 'jpg'],
    code: ['js', 'json'],
    txt: ['log', 'txt', 'html', 'css', 'xml'],
};

function getFileExtension(fileName) {
    const pos = fileName.lastIndexOf('.');
    if (pos !== -1) {
        return fileName.substring(pos + 1).toLowerCase();
    } else {
        return null;
    }
}

class FileViewer extends Component {
    constructor(props) {
        super(props);

        this.ext = getFileExtension(this.props.href); // todo: replace later with Utils.getFileExtension

        this.state = {
            text: null,
            code: null,
            copyPossible: EXTENSIONS.code.includes(this.ext) || EXTENSIONS.txt.includes(this.ext)
        };

        if (this.state.copyPossible) {
            fetch(this.props.href)
                .then(response => response.text())
                .then(data => {
                    if (EXTENSIONS.txt.includes(this.ext)) {
                        this.setState({ text: data });
                    } else if (EXTENSIONS.code.includes(this.ext)) {
                        this.setState({ code: data });
                    }
                });
        }
    }

    static getDerivedStateFromProps() {

    }

    getContent() {
        if (EXTENSIONS.images.includes(this.ext)) {
            return <img
                onError={e => {
                    e.target.onerror = null;
                    e.target.src = NoImage
                }}
                className={clsx(this.props.classes.img, this.props.getClassBackgroundImage())}
                src={this.props.href} alt={this.props.href} />;
        } else if (this.state.code !== null) {
            return <TextField
                className={this.props.classes.textarea}
                multiline
                value={this.state.code}
                readOnly={true} />;
        } else if (this.state.text !== null) {
            return <TextField
                className={this.props.classes.textarea}
                value={this.state.code}
                multiline
                readOnly={true} />;
        }
    }

    render() {
        return <Dialog
            classes={{ scrollPaper: this.props.classes.dialog, paper: this.props.classes.paper }}
            scroll="paper"
            key={this.props.key}
            open={this.props.href}
            onClose={() => this.props.onClose()}
            fullWidth={true}
            maxWidth="xl"
            aria-labelledby="form-dialog-title"
        >
            <div className={this.props.classes.dialogTitle}>
                <DialogTitle id="form-dialog-title">{this.props.t('View: %s', this.props.href)}</DialogTitle>
                {EXTENSIONS.images.includes(this.ext) && <div>
                    <IconButton
                        color={'inherit'}
                        onClick={this.props.setStateBackgroundImage}
                    >
                        <Brightness5Icon />
                    </IconButton>
                </div>
                }
            </div>
            <DialogContent className={this.props.classes.content}>
                {this.getContent()}
            </DialogContent>
            <DialogActions>
                {this.state.copyPossible ?
                    <Button
                        variant="contained"
                        onClick={e => Utils.copyToClipboard(this.state.text || this.state.code, e)} >
                        <CopyIcon />
                        {this.props.t('Copy content')}
                    </Button> : null}

                <Button
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    color="primary">
                    <CloseIcon />
                    {this.props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

FileViewer.propTypes = {
    key: PropTypes.string,
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    onClose: PropTypes.func,
    href: PropTypes.string.isRequired
};

export default withWidth()(withStyles(styles)(FileViewer));
