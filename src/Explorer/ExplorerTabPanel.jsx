import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ExplorerTabs, ExplorerTab, ExplorerTabBox, ExplorerTabFrame } from './style';
import { ExplorerTableComponent } from './ExplorerTable';
import {setActiveTab, requestMoreData, changePage, changePageSize} from "./actions";

const makeDefaultState = () => ({
});

class TabSetComponent extends Component {
  static propTypes = {
    filesMap: PropTypes.object.isRequired,
    lastPageSizes: PropTypes.object.isRequired,
    pageSize: PropTypes.number.isRequired,
    pagesPerTab: PropTypes.number.isRequired,
    activeTab: PropTypes.string.isRequired,
    currentPages: PropTypes.object.isRequired,
    cursors: PropTypes.object,
    queriedCursors: PropTypes.object,
    onTabChange: PropTypes.func.isRequired,
    onPageLoadMore: PropTypes.func,
    onPageSizeChange: PropTypes.func,
    onPageChange: PropTypes.func,
  };

  static defaultProps = {
    cursors: {},
    queriedCursors: {},
    onPageLoadMore: () => {},
    onPageSizeChange: () => {},
    onPageChange: () => {},
  };

  constructor(props) {
    super(props);
    this.state = makeDefaultState();
    this.resetState = this.resetState.bind(this);
  }

  resetState() {
    this.setState(makeDefaultState({}));
  }

  updateCursors(key, newValue, pageSize) {
    const numberOfItemPages = pageSize * this.props.pagesPerTab;
    return Object.keys(this.props.cursors).reduce(
      (d, it) => {
        const result = d;
        if (it !== key) {
          result[it] = this.props.queriedCursors
            ? this.props.queriedCursors[it]
            : 0;
        } else if (newValue < 0) {
          const tempRes = this.props.cursors[it] + (2 * newValue) +
            (((2 * numberOfItemPages) - this.props.cursors[it]) % numberOfItemPages);
          result[it] = (tempRes >= 0) ? tempRes : 0;
        } else {
          result[it] = this.props.cursors[it];
        }
        return result;
      }, {},
    );
  }

  updateTab(key, newValue) {
    const newCursors = this.updateCursors(key, newValue, this.props.pageSize);
    this.props.onPageLoadMore({ cursors: newCursors, originalPageToReset: [key] });
  }

  updateOriginalPage() {
    return Object.keys(this.props.cursors).reduce(
      (d, it) => {
        d[it] = ((this.props.cursors[it] - 1) / this.props.pageSize)
          - (((this.props.cursors[it] - 1) / this.props.pageSize) % this.props.pagesPerTab);
        return d;
      }, {},
    );
  }

  doSelectChange(value) {
    const newCursors = this.updateCursors('', 0, this.props.pageSize);
    this.props.onPageSizeChange({ cursors: newCursors, pageSize: parseInt(value) });
  }

  render() {
    const originalPages = this.updateOriginalPage();
    const flexItem = {
      flexBasis: '80%',
      flexGrow: 1,
    };
    return (
      <div style={flexItem}>
        <ExplorerTabs>
          {
            Object.keys(this.props.filesMap).map(
              (item, i) => (this.props.filesMap[item].length > 0) &&
              <ExplorerTab
                key={i}
                active={(item === this.props.activeTab)}
                onClick={
                  () => this.props.onTabChange({ activeTab: item })
                }
              >
                {item.replace('submitted_', '').replace('_', ' ')}
              </ExplorerTab>)
          }
        </ExplorerTabs>
        <ExplorerTabFrame>
          {
            Object.keys(this.props.filesMap).map(
              (item, i) =>
                (this.props.filesMap[item].length > 0)
                && <ExplorerTabBox key={2 * i} active={(item === this.props.activeTab)}>
                  <ExplorerTableComponent
                    key={(2 * i) + 1}
                    filesList={this.props.filesMap[item]}
                    name={item}
                    lastPageSize={this.props.lastPageSizes[item]}
                    pageSize={this.props.pageSize}
                    pageCount={this.props.pagesPerTab}
                    originalPage={originalPages[item]}
                    onPageLoadNextMore={
                      () => {
                        this.updateTab(item,
                          this.props.pageSize * this.props.pagesPerTab);
                      }
                    }
                    page={(item in this.props.currentPages)
                      ? this.props.currentPages[item] : 0}
                    onPageChange={
                      (page) => {
                        const currentPages = this.props.currentPages;
                        currentPages[item] = page;
                        this.props.onPageChange(currentPages);
                      }
                    }
                    onPageLoadPrevMore={
                      () => {
                        this.updateTab(item,
                          -this.props.pageSize * this.props.pagesPerTab);
                      }
                    }
                    onPageSizeChange={value => this.doSelectChange(value)}
                  />
                </ExplorerTabBox>,
            )
          }
        </ExplorerTabFrame>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  filesMap: state.explorer.filesMap,
  lastPageSizes: state.explorer.lastPageSizes,
  pageSize: state.explorer.pageSize,
  pagesPerTab: state.explorer.pagesPerTab,
  activeTab: state.explorer.activeTab,
  cursors: state.explorer.cursors,
  queriedCursors: state.explorer.queriedCursors,
  currentPages: state.explorer.currentPages,
});

const mapDispatchToProps = dispatch => ({
  onTabChange: (state) => dispatch(setActiveTab(state)),
  onPageLoadMore: (state) => dispatch(requestMoreData(state)),
  onPageSizeChange: (state) => dispatch(changePageSize(state)),
  onPageChange: (state) => dispatch(changePage(state))
});

const ExplorerTabPanel = connect(mapStateToProps, mapDispatchToProps)(TabSetComponent);
export default ExplorerTabPanel;
