import React from 'react';
import { Card, CardMedia, } from "@material-ui/core";
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from "prop-types";

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles = theme => ({
    root: {
        position: 'relative',
        margin: 10,
        width: 300,
        minHeight: 200,
        background: theme.palette.background.default,
        boxShadow,
        display: 'flex',
        transition: 'box-shadow 0.5s',
        cursor: 'pointer',
        '&:hover': {
            boxShadow: boxShadowHover
        }
    },
    imageBlock: {
        background: 'silver',
        minHeight: 60,
        display: 'flex',
        padding: '0 10px 0 10px',
        position: 'relative',
        justifyContent: 'space-between',
        transition: 'background 0.5s',
    },
    img: {
        width: 60,
        height: 60,
        marginTop: 20,
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            zIndex: 2,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("img/no-image.png") 100% 100% no-repeat',
            backgroundSize: 'cover',
            backgroundColor: '#fff',
        }
    },
    adapter: {
        width: '100%',
        fontWeight: 'bold',
        fontSize: 16,
        verticalAlign: 'middle',
        marginTop: 'auto',
        borderTop: '1px solid silver',
        padding: 20,
        textAlign: 'center',
        textTransform: 'uppercase',
        color: '#ffab40'
    },
    instanceStateNotAlive1: {
        backgroundColor: 'rgba(192, 192, 192, 0.4)'
    },
    wrapperDesc: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
    },
    desc: {
        padding: 20,
        fontSize: 15,
    }
});
const EasyModeCard = ({
    classes,
    icon,
    id,
    key,
    desc,
    navigate
}) => {
    return <Card onClick={navigate} key={key} className={classes.root}>
        <div className={clsx(
            classes.imageBlock, classes.instanceStateNotAlive1,
        )}>
            <CardMedia className={classes.img} component="img" image={`adapter/${id.split('.')[0]}/${icon}` || 'img/no-image.png'} />
        </div>
        <div className={classes.wrapperDesc}>
            <div className={classes.desc}>{desc}</div>
            <div className={classes.adapter}>{id}</div>
        </div>
    </Card>
}

EasyModeCard.propTypes = {
    /**
     * Link and text
     * {link: 'https://example.com', text: 'example.com'}
     */
    t: PropTypes.func,
};

export default withStyles(styles)(EasyModeCard);