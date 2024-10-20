'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">memoz documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/Indexing.html" data-type="entity-link" >Indexing</a>
                            </li>
                            <li class="link">
                                <a href="classes/IndexManager.html" data-type="entity-link" >IndexManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/LRUCache.html" data-type="entity-link" >LRUCache</a>
                            </li>
                            <li class="link">
                                <a href="classes/Memoz.html" data-type="entity-link" >Memoz</a>
                            </li>
                            <li class="link">
                                <a href="classes/Mutex.html" data-type="entity-link" >Mutex</a>
                            </li>
                            <li class="link">
                                <a href="classes/PersistenceManager.html" data-type="entity-link" >PersistenceManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/QueryBuilder.html" data-type="entity-link" >QueryBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/QueryCache.html" data-type="entity-link" >QueryCache</a>
                            </li>
                            <li class="link">
                                <a href="classes/SearchEngine.html" data-type="entity-link" >SearchEngine</a>
                            </li>
                            <li class="link">
                                <a href="classes/Shard.html" data-type="entity-link" >Shard</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransactionManager.html" data-type="entity-link" >TransactionManager</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/FuzzySearchOptions.html" data-type="entity-link" >FuzzySearchOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LRUCacheOptions.html" data-type="entity-link" >LRUCacheOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MemozOptions.html" data-type="entity-link" >MemozOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QueryCacheOptions.html" data-type="entity-link" >QueryCacheOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SimpleCondition.html" data-type="entity-link" >SimpleCondition</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});