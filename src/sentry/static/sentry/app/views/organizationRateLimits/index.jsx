import jQuery from 'jquery';
import React from 'react';

import ApiMixin from '../../mixins/apiMixin';
import IndicatorStore from '../../stores/indicatorStore';
import OrganizationHomeContainer from '../../components/organizations/homeContainer';
import OrganizationState from '../../mixins/organizationState';
import {NumberField} from '../../components/forms';
import {t} from '../../locale';

class RateLimitField extends NumberField {
  render() {
    let className = 'control-group';
    if (this.props.error) {
      className += ' has-error';
    }
    return (
      <div className={className}>
        <div className="controls">
          {this.props.label &&
            <label htmlFor={this.getId()} className="control-label">{this.props.label}</label>
          }
          <div>
            <span style={{maxWidth: 100, display: 'inline-block'}}>
              {this.getField()}
            </span>
            <small style={{color: '#666', margin: '0 5px'}}> / minute</small>
            {this.props.disabled && this.props.disabledReason &&
              <span className="disabled-indicator tip"
                    title={this.props.disabledReason}>
                <span className="icon-question" />
              </span>
            }
          </div>
          {this.props.help &&
            <p className="help-block">{this.props.help}</p>
          }
          {this.props.error &&
            <p className="error">{this.props.error}</p>
          }
        </div>
      </div>
    );
  }
}


const RangeInput = React.createClass({
  propTypes: {
    min: React.PropTypes.number.isRequired,
    max: React.PropTypes.number.isRequired,
    step: React.PropTypes.number.isRequired,
    defaultValue: React.PropTypes.number,
    formatLabel: React.PropTypes.func.isRequired,
    onChange: React.PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      min: 1,
      max: 100,
      step: 1,
      formatLabel: function(value) {
        return value;
      },
      onChange: function(e, value) {

      },
    };
  },

  getInitialState() {
    return {
      value: this.props.defaultValue,
    };
  },

  componentDidMount() {
    let {min, max, step} = this.props;
    let $value = jQuery('<span class="value" />');
    jQuery(this.refs.input).on('slider:ready', (e, data) => {
      $value.appendTo(data.el);
      $value.text(this.props.formatLabel(data.value));
      this.setState({
        value: data.value,
      });
    }).on('slider:changed', (e, data) => {
      $value.text(this.props.formatLabel(data.value));
      this.setState({
        value: data.value,
      });
      this.props.onChange(e, data.value);
    }).simpleSlider({
      range: [min, max],
      step: step,
      snap: true
    });
  },

  render() {
    let {min, max, step} = this.props;
    let {value} = this.state;
    return (
      <input type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          ref="input" />
    );
  },
});

const RateLimitEditor = React.createClass({
  propTypes: {
    organization: React.PropTypes.object.isRequired
  },

  mixins: [ApiMixin],

  getInitialState() {
    let projectLimit = this.props.organization.quota.projectLimit;

    return {
      activeNav: 'rate-limits',
      currentProjectLimit: projectLimit,
      savedProjectLimit: projectLimit,
    };
  },

  onProjectLimitChange(e, value) {
    this.setState({
      currentProjectLimit: value,
    });
  },

  onSubmit(e) {
    e.preventDefault();

    let loadingIndicator = IndicatorStore.add(t('Saving..'));

    this.setState({
      saving: true,
      error: false,
    }, () => {
      this.api.request(`/organizations/${this.props.organization.slug}/`, {
        method: 'PUT',
        data: {
          projectRateLimit: this.state.currentProjectLimit
        },
        success: (data) => {
          // TODO(dcramer): propagate this change correctly (how??)
          this.props.organization.quota = data.quota;
          this.setState({
            saving: false,
            savedProjectLimit: data.quota.projectLimit,
          });
        },
        complete: () => {
          IndicatorStore.remove(loadingIndicator);
        },
      });
    });
  },

  render() {
    let {currentProjectLimit, savedProjectLimit, saving} = this.state;
    let maxRate = this.props.organization.quota.maxRate;
    let canSave = savedProjectLimit === currentProjectLimit && !saving;

    return (
      <form onSubmit={this.onSubmit}>
        <p>Rate limits allow you to control how much data is stored for this organization. When a rate is exceeded the system will begin discarding data until the next interval.</p>

        <br />

        <h5>Global Limit</h5>

        <RateLimitField
            help="The maximum number of events to accept across this entire organization."
            placeholder="e.g. 500"
            value={maxRate}
            disabled={maxRate > 0}
            disabledReason="Your organization has a fixed rate limit, so this option is not configurable."
            onChange={this.onRateLimitChange}
            inputClassName="col-md-3" />

        <br />

        <h5>Project Limits</h5>

        <p>{t('You may also set a limit to the maximum amount a single project may send:')}</p>

        <RangeInput
            defaultValue={savedProjectLimit}
            onChange={this.onProjectLimitChange}
            formatLabel={(value) => { return `${value}%`; }} />

        <div className="help-block">{t('The maximum percentage of your quota an individual project can consume.')}</div>

        <div className="form-actions" style={{marginTop: 25}}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={canSave}>{t('Apply Changes')}</button>
        </div>
      </form>
    );
  }
});

const OrganizationRateLimits = React.createClass({
  mixins: [OrganizationState],

  render() {
    if (!this.context.organization)
      return null;

    let org = this.context.organization;

    return (
      <OrganizationHomeContainer>
        <div className="box">
          <div className="box-header">
            <h3>{t('Rate Limits')}</h3>
          </div>
          <div className="box-content with-padding">
            <RateLimitEditor organization={org} />
          </div>
        </div>
      </OrganizationHomeContainer>
    );
  },
});


export default OrganizationRateLimits;
