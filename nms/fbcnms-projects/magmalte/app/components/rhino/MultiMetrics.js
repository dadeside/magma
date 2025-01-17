/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {MetricGraphConfig} from '@fbcnms/magmalte/app/components/insights/Metrics';
import type {TimeRange} from '@fbcnms/magmalte/app/components/insights/AsyncMetric';

import AppBar from '@material-ui/core/AppBar';
import AsyncMetric from '@fbcnms/magmalte/app/components/insights/AsyncMetric';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import FormControl from '@material-ui/core/FormControl';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import InputLabel from '@material-ui/core/InputLabel';
import LoadingFiller from '@fbcnms/ui/components/LoadingFiller';
import MagmaV1API from '@fbcnms/magma-api/client/WebClient';
import MenuItem from '@material-ui/core/MenuItem';
import React from 'react';
import Select from '@material-ui/core/Select';
import TimeRangeSelector from '@fbcnms/magmalte/app/components/insights/TimeRangeSelector';
import Typography from '@material-ui/core/Typography';
import {Route} from 'react-router-dom';

import useMagmaAPI from '../../common/useMagmaAPI';
import {find, map} from 'lodash';
import {makeStyles} from '@material-ui/styles';
import {resolveQuery} from '@fbcnms/magmalte/app/components/insights/Metrics';
import {useRouter, useSnackbar} from '@fbcnms/ui/hooks';
import {useState} from 'react';

const useStyles = makeStyles(theme => ({
  appBar: {
    display: 'inline-block',
  },
  chartRow: {
    display: 'flex',
  },
  formControl: {
    minWidth: '200px',
    padding: theme.spacing(),
  },
}));

function MultiMetrics(props: {
  onGatewaySelectorChange: (SyntheticInputEvent<EventTarget>) => void,
  configs: Array<MetricGraphConfig>,
}) {
  const {match} = useRouter();
  const classes = useStyles();
  const selectedGateway = match.params.selectedGatewayId;
  const [timeRange, setTimeRange] = useState<TimeRange>('24_hours');

  const {error, isLoading, response: gateways} = useMagmaAPI(
    MagmaV1API.getNetworksByNetworkIdGateways,
    {networkId: match.params.networkId},
  );

  useSnackbar('Error fetching devices', {variant: 'error'}, error);

  if (error || isLoading || !gateways) {
    return <LoadingFiller />;
  }

  const defaultGateway = find(
    gateways,
    gateway => gateway.status?.hardware_id !== null,
  );
  const selectedGatewayOrDefault = selectedGateway || defaultGateway?.id;

  return (
    <>
      <AppBar className={classes.appBar} position="static" color="default">
        <FormControl variant="filled" className={classes.formControl}>
          <InputLabel htmlFor="devices">Device</InputLabel>
          <Select
            inputProps={{id: 'devices'}}
            value={selectedGatewayOrDefault}
            onChange={props.onGatewaySelectorChange}>
            {map(gateways, device => (
              <MenuItem value={device.id} key={device.id}>
                {device.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TimeRangeSelector
          className={classes.formControl}
          value={timeRange}
          onChange={setTimeRange}
        />
      </AppBar>
      <GridList cols={2} cellHeight={400}>
        {props.configs.map((config, i) => (
          <GridListTile key={i} cols={1}>
            <Card>
              <CardContent>
                <Typography component="h6" variant="h6">
                  {config.label}
                </Typography>
                <div style={{height: 350}}>
                  <AsyncMetric
                    label={config.label}
                    unit={config.unit || ''}
                    queries={resolveQuery(config, selectedGatewayOrDefault)}
                    timeRange={timeRange}
                  />
                </div>
              </CardContent>
            </Card>
          </GridListTile>
        ))}
      </GridList>
    </>
  );
}

export default function(props: {configs: Array<MetricGraphConfig>}) {
  const {history, relativePath, relativeUrl} = useRouter();
  return (
    <Route
      path={relativePath('/:selectedGatewayId?')}
      render={() => (
        <MultiMetrics
          configs={props.configs}
          onGatewaySelectorChange={({target}) =>
            history.push(relativeUrl(`/${target.value}`))
          }
        />
      )}
    />
  );
}
