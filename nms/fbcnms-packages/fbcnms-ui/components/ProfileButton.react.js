/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import AppContext from '@fbcnms/ui/context/AppContext';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Popout from '@fbcnms/ui/components/Popout.react';
import ProfileIcon from '../icons/ProfileIcon.react';
import React, {useContext, useState} from 'react';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';
import {Events, GeneralLogger} from '@fbcnms/ui/utils/Logging';
import {makeStyles} from '@material-ui/styles';
import {useRouter} from '@fbcnms/ui/hooks';

const useStyles = makeStyles(theme => ({
  accountButton: {
    backgroundColor: theme.palette.common.white,
    width: '36px',
    height: '36px',
    fontSize: '36px',
    cursor: 'pointer',
    borderRadius: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&:hover, &$openButton': {
      '& $accountButtonIcon': {
        fill: theme.palette.primary.main,
      },
    },
  },
  openButton: {},
  accountButtonIcon: {
    '&&': {
      fill: theme.palette.blueGrayDark,
      fontSize: '19px',
    },
  },
  itemGutters: {
    '&&': {
      minWidth: '170px',
      borderRadius: '4px',
      padding: '8px 10px',
      '&:hover': {
        backgroundColor: 'rgba(145, 145, 145, 0.1)',
      },
    },
  },
  profileList: {
    '&&': {
      padding: '10px 5px',
    },
  },
  profileItemText: {
    fontSize: '12px',
    lineHeight: '16px',
  },
}));

type Props = {
  showSettings: boolean,
  user: {
    email: string,
    isSuperUser: boolean,
  },
};

const ProfileButton = (props: Props) => {
  const {user} = props;
  const {email} = user;
  const {relativeUrl, history} = useRouter();
  const classes = useStyles();
  const [isProfileMenuOpen, toggleProfileMenu] = useState(false);
  const showDocs = useContext(AppContext).isFeatureEnabled('documents_site');

  return (
    <Popout
      open={isProfileMenuOpen}
      content={
        <List component="nav" className={classes.profileList}>
          <ListItem classes={{gutters: classes.itemGutters}} disabled={true}>
            <Typography className={classes.profileItemText}>{email}</Typography>
          </ListItem>
          {props.showSettings && (
            <ListItem
              classes={{gutters: classes.itemGutters}}
              button
              onClick={() => {
                GeneralLogger.info(Events.SETTINGS_CLICKED);
                toggleProfileMenu(false);
                history.push(relativeUrl('/settings'));
              }}
              component="a">
              <Typography className={classes.profileItemText}>
                Settings
              </Typography>
            </ListItem>
          )}
          {showDocs && (
            <ListItem
              classes={{gutters: classes.itemGutters}}
              button
              href={'/docs/docs/inventory-intro.html'}
              onClick={() =>
                GeneralLogger.info(Events.DOCUMENTATION_LINK_CLICKED)
              }
              component="a">
              <Typography className={classes.profileItemText}>
                Documentation
              </Typography>
            </ListItem>
          )}
          <ListItem
            classes={{gutters: classes.itemGutters}}
            button
            href="/user/logout"
            component="a">
            <Typography className={classes.profileItemText}>Logout</Typography>
          </ListItem>
        </List>
      }
      onOpen={() => toggleProfileMenu(true)}
      onClose={() => toggleProfileMenu(false)}>
      <div
        className={classNames({
          [classes.accountButton]: true,
          [classes.openButton]: isProfileMenuOpen,
        })}>
        <ProfileIcon className={classes.accountButtonIcon} />
      </div>
    </Popout>
  );
};

export default ProfileButton;
