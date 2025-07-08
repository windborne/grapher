import React from 'react';
import PropTypes from 'prop-types';
import pageList from './page_list';
import './example_page.scss';

const PageLink = ({page, currentPage}) => {
    return (
        <li>
            <a href={`/examples/${page}.html`}>
                {
                    page === currentPage ?
                        <b>{page}</b> :
                        page
                }
            </a>
        </li>
    );
};

PageLink.propTypes = {
    page: PropTypes.string.isRequired,
    currentPage: PropTypes.string.isRequired
};

const PagesSection = ({pages, currentPage, name}) => {
    return (
        <div className="pages-section">
            <div className="section-title">
                {name}
            </div>

            <ul>
                {
                    pages.map((page, i) => <PageLink
                        key={i}
                        page={page}
                        currentPage={currentPage}
                    />)
                }
            </ul>
        </div>
    );
};

PagesSection.propTypes = {
    pages: PropTypes.arrayOf(PropTypes.string).isRequired,
    name: PropTypes.string.isRequired,
    currentPage: PropTypes.string.isRequired
};

export default class ExamplePage extends React.PureComponent {

    componentDidMount() {
        document.title = this.props.page;
    }

    render() {
        const sections = [];
        const sectionlessPages = [];

        for (let pageOrSection of pageList) {
            if (typeof pageOrSection === 'string') {
                sectionlessPages.push(pageOrSection);
            } else {
                sections.push(pageOrSection);
            }
        }

        return (
            <div className="example-page">
                {this.props.children}

                <div className="list-header">
                    View other examples
                </div>

                <div className="page-list">
                    {
                        sections.map((pageOrSection, i) =>
                            <PagesSection
                                key={i}
                                currentPage={this.props.page}
                                {...pageOrSection}
                            />
                        )
                    }

                    {
                        sectionlessPages.length > 0 &&
                        <PagesSection
                            name="Other"
                            pages={sectionlessPages}
                            currentPage={this.props.page}
                        />
                    }
                </div>
            </div>
        );
    }

}

ExamplePage.propTypes = {
    page: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
};
