/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package receivers

import (
	"net/url"
	"testing"

	"github.com/prometheus/alertmanager/config"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/assert"
)

var (
	sampleURL, _ = url.Parse("http://test.com")
	sampleRoute  = config.Route{
		Receiver: "testReceiver",
		Routes: []*config.Route{
			{
				Receiver: "testReceiver",
			},
			{
				Receiver: "slack_receiver",
			},
		},
	}
	sampleReceiver = Receiver{
		Name: "testReceiver",
	}
	sampleSlackReceiver = Receiver{
		Name: "slack_receiver",
		SlackConfigs: []*SlackConfig{{
			APIURL:   "http://slack.com/12345",
			Username: "slack_user",
			Channel:  "slack_alert_channel",
		}},
	}
	sampleWebhookReceiver = Receiver{
		Name: "webhook_receiver",
		WebhookConfigs: []*config.WebhookConfig{{
			URL: &config.URL{
				URL: sampleURL,
			},
			NotifierConfig: config.NotifierConfig{
				VSendResolved: true,
			},
		}},
	}
	sampleConfig = Config{
		Route: &sampleRoute,
		Receivers: []*Receiver{
			&sampleSlackReceiver, &sampleReceiver, &sampleWebhookReceiver,
		},
	}
)

func TestConfig_Validate(t *testing.T) {
	defaultGlobalConf := config.DefaultGlobalConfig()
	validConfig := Config{
		Route:     &sampleRoute,
		Receivers: []*Receiver{&sampleReceiver, &sampleSlackReceiver},
		Global:    &defaultGlobalConf,
	}
	err := validConfig.Validate()
	assert.NoError(t, err)

	invalidConfig := Config{
		Route:     &sampleRoute,
		Receivers: []*Receiver{},
		Global:    &defaultGlobalConf,
	}
	err = invalidConfig.Validate()
	assert.EqualError(t, err, `undefined receiver "testReceiver" used in route`)

	invalidSlackReceiver := Receiver{
		Name: "invalidSlack",
		SlackConfigs: []*SlackConfig{
			{
				APIURL: "invalidURL",
			},
		},
	}

	invalidSlackConfig := Config{
		Route: &config.Route{
			Receiver: "invalidSlack",
		},
		Receivers: []*Receiver{&invalidSlackReceiver},
		Global:    &defaultGlobalConf,
	}
	err = invalidSlackConfig.Validate()
	assert.EqualError(t, err, `unsupported scheme "" for URL`)

	// Fail if action is missing a type
	invalidSlackAction := Config{
		Route: &config.Route{
			Receiver: "invalidSlackAction",
		},
		Receivers: []*Receiver{{
			Name: "invalidSlackAction",
			SlackConfigs: []*SlackConfig{{
				APIURL: "http://slack.com",
				Actions: []*config.SlackAction{{
					URL:  "test.com",
					Text: "test",
				}},
			}},
		}},
	}
	err = invalidSlackAction.Validate()
	assert.EqualError(t, err, `missing type in Slack action configuration`)
}

func TestConfig_GetReceiver(t *testing.T) {
	rec := sampleConfig.GetReceiver("testReceiver")
	assert.NotNil(t, rec)

	rec = sampleConfig.GetReceiver("slack_receiver")
	assert.NotNil(t, rec)

	rec = sampleConfig.GetReceiver("webhook_receiver")
	assert.NotNil(t, rec)

	rec = sampleConfig.GetReceiver("nonRoute")
	assert.Nil(t, rec)
}

func TestConfig_GetRouteIdx(t *testing.T) {
	idx := sampleConfig.GetRouteIdx("testReceiver")
	assert.Equal(t, 0, idx)

	idx = sampleConfig.GetRouteIdx("slack_receiver")
	assert.Equal(t, 1, idx)

	idx = sampleConfig.GetRouteIdx("nonRoute")
	assert.Equal(t, -1, idx)
}

func TestReceiver_Secure(t *testing.T) {
	rec := Receiver{Name: "receiverName"}
	rec.Secure(testNID)
	assert.Equal(t, "test_receiverName", rec.Name)
}

func TestReceiver_Unsecure(t *testing.T) {
	rec := Receiver{Name: "receiverName"}
	rec.Secure(testNID)
	assert.Equal(t, "test_receiverName", rec.Name)

	rec.Unsecure(testNID)
	assert.Equal(t, "receiverName", rec.Name)
}

func TestRouteJSONWrapper_ToPrometheusConfig(t *testing.T) {
	jsonRoute := RouteJSONWrapper{
		Receiver:       "receiver",
		GroupByStr:     []string{"groupBy"},
		Match:          map[string]string{"match": "value"},
		Continue:       true,
		GroupWait:      "5s",
		GroupInterval:  "6s",
		RepeatInterval: "7s",
	}

	fiveSeconds, _ := model.ParseDuration("5s")
	sixSeconds, _ := model.ParseDuration("6s")
	sevenSeconds, _ := model.ParseDuration("7s")

	expectedRoute := config.Route{
		Receiver:       "receiver",
		GroupByStr:     []string{"groupBy"},
		Match:          map[string]string{"match": "value"},
		Continue:       true,
		GroupWait:      &fiveSeconds,
		GroupInterval:  &sixSeconds,
		RepeatInterval: &sevenSeconds,
	}

	route, err := jsonRoute.ToPrometheusConfig()
	assert.NoError(t, err)
	assert.Equal(t, expectedRoute, route)
}
