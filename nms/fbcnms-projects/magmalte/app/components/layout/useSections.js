/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {NetworkContextType} from '../context/NetworkContext';
import type {NetworkType} from '@fbcnms/types/network';
import type {SectionsConfigs} from '../layout/Section';

import AppContext from '@fbcnms/ui/context/AppContext';
import NetworkContext from '../context/NetworkContext';
import {coalesceNetworkType} from '@fbcnms/types/network';
import {useContext, useEffect, useState} from 'react';

import MagmaV1API from '@fbcnms/magma-api/client/WebClient';
import {LTE, RHINO, THIRD_PARTY, WAC, WIFI} from '@fbcnms/types/network';
import {getDevicesSections} from '@fbcnms/magmalte/app/components/devices/DevicesSections';
import {getLteSections} from '@fbcnms/magmalte/app/components/lte/LteSections';
import {getMeshSections} from '@fbcnms/magmalte/app/components/wifi/WifiSections';
import {getRhinoSections} from '@fbcnms/magmalte/app/components/rhino/RhinoSections';
import {getWACSections} from '@fbcnms/magmalte/app/components/wac/WACSections';

export default function useSections(): SectionsConfigs {
  const {networkId} = useContext<NetworkContextType>(NetworkContext);
  const {isFeatureEnabled} = useContext(AppContext);
  const [networkType, setNetworkType] = useState<?NetworkType>(null);
  const alertsEnabled = isFeatureEnabled('alerts');
  const logsEnabled = isFeatureEnabled('logs');

  useEffect(() => {
    if (networkId) {
      MagmaV1API.getNetworksByNetworkIdType({networkId}).then(networkType =>
        setNetworkType(coalesceNetworkType(networkId, networkType)),
      );
    }
  }, [networkId]);

  if (!networkId || networkType === null) {
    return [null, []];
  }

  switch (networkType) {
    case WIFI:
      return getMeshSections(alertsEnabled);
    case THIRD_PARTY:
      return getDevicesSections(alertsEnabled);
    case WAC:
      return getWACSections();
    case RHINO:
      return getRhinoSections();
    case LTE:
    default:
      return getLteSections(alertsEnabled, logsEnabled);
  }
}
