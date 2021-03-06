'use strict';

/**
 * Module dependencies.
 */

var CP_page     = require('../../lib/CP_page');
var CP_get      = require('../../lib/CP_get.min');

var CP_comments = require('../../modules/CP_comments');

/**
 * Configuration dependencies.
 */

var config  = require('../../config/production/config');
var modules = require('../../config/production/modules');

/**
 * Node dependencies.
 */

var async = require('async');

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [render]
 */

/**
 * Getting the data to custom contents.
 *
 * @param {String} tag
 * @param {Object} [options]
 * @param {Callback} callback
 */

function allContents(tag, options, callback) {

    if (arguments.length === 1) {
        callback = options;
        options = {};
        options.domain = '' + config.domain;
    }

    var query = (tag)
        ? {"content_tags": tag}
        : {};

    async.parallel({
            "categories": function (callback) {
                options.content_image = config.default.image;
                CP_get.contents(
                    query,
                    100,
                    1,
                    true,
                    options,
                    function (err, contents) {
                        if (options.debug) {
                            options.debug.detail.push({"type": "contents", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                            options.debug.duration.current = new Date();
                        }
                        if (err) return callback(err);

                        return (contents && contents.length)
                            ? callback(null, contents)
                            : callback(null, [])
                    });
            },
            "slider": function (callback) {
                return (modules.slider.status)
                    ? CP_get.additional(
                    {"query_id": modules.slider.data.movies},
                    'ids',
                    options,
                    function (err, movies) {
                        if (options.debug) {
                            options.debug.detail.push({"type": "slider", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                            options.debug.duration.current = new Date();
                        }
                        if (err) return callback(err);

                        return (movies && movies.length)
                            ? callback(null, movies)
                            : callback(null, [])
                    })
                    : callback(null, [])
            },
            "soon": function (callback) {
                return (modules.soon.status)
                    ? CP_get.additional(
                    {"all_movies": process.env.CP_ALL},
                    'soon',
                    options,
                    function (err, movies) {
                        if (options.debug) {
                            options.debug.detail.push({"type": "soon", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                            options.debug.duration.current = new Date();
                        }
                        if (err) return callback(err);

                        return (movies && movies.length)
                            ? callback(null, movies)
                            : callback(null, [])
                    })
                    : callback(null, [])
            },
            "news": function (callback) {
                return (modules.content.status && modules.content.data.news.tags && modules.content.data.news.count)
                    ? CP_get.contents(
                        {"content_tags": modules.content.data.news.tags},
                        modules.content.data.news.count,
                        1,
                        true,
                        options,
                        function (err, contents) {
                            if (options.debug) {
                                options.debug.detail.push({"type": "news", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                                options.debug.duration.current = new Date();
                            }
                            if (err) return callback(err);

                            return (contents && contents.length)
                                ? callback(null, contents)
                                : callback(null, [])
                        })
                    : callback(null, [])
            }
        },
        function(err, result) {

            if (err) return callback(err);

            for (var r in result) {
                if (result.hasOwnProperty(r) && result[r] === null) {
                    delete result[r];
                }
            }

            CP_page.contents(query, result, options, function (err, result) {
                if (options.debug) {
                    options.debug.detail.push({"type": "page", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                    options.debug.duration.current = new Date();
                }
                callback(err, result);
            });

        });

}

/**
 * Getting the data to render content.
 *
 * @param {String} url
 * @param {Number} page
 * @param {String} sorting
 * @param {Object} [options]
 * @param {Callback} callback
 */

function oneContent(url, page, sorting, options, callback) {

    if (arguments.length === 4) {
        callback = options;
        options = {};
        options.domain = '' + config.domain;
    }

    page = (page) ? page : 1;
    var query = '';

    async.series({
            "content": function (callback) {
                return CP_get.contents(
                    {"content_url": url},
                    1,
                    1,
                    true,
                    options,
                    function (err, contents) {
                        if (options.debug) {
                            options.debug.detail.push({"type": "content", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                            options.debug.duration.current = new Date();
                        }
                        if (err) return callback(err);

                        if (contents && contents.length && contents[0].movies && contents[0].movies.length) {
                            var query_id = [];
                            contents[0].movies.forEach(function (item, i, arr) {
                                query_id.push(item + '^' + (parseInt(arr.length) - parseInt(i)))
                            });
                            query = {"query_id": query_id.join('|')};
                        }

                        return (contents && contents.length)
                            ? callback(null, contents[0])
                            : callback('Страницы не существует! Возможно она еще не создана, либо Вы ошиблись в URL.')
                    });
            },
            "movies": function (callback) {
                if (!query) return callback(null, []);
                return CP_get.movies(
                    query,
                    config.default.count,
                    sorting,
                    page,
                    true,
                    options,
                    function (err, movies) {
                        if (options.debug) {
                            options.debug.detail.push({"type": "movies", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                            options.debug.duration.current = new Date();
                        }
                        if (err) return callback(err);

                        return (movies && movies.length)
                            ? callback(null, movies)
                            : callback(null, [])
                    });
            },
            "slider": function (callback) {
                return (modules.slider.status)
                    ? CP_get.additional(
                    {"query_id": modules.slider.data.movies},
                    'ids',
                    options,
                    function (err, movies) {
                        if (options.debug) {
                            options.debug.detail.push({"type": "slider", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                            options.debug.duration.current = new Date();
                        }
                        if (err) return callback(err);

                        return (movies && movies.length)
                            ? callback(null, movies)
                            : callback(null, [])
                    })
                    : callback(null, [])
            },
            "soon": function (callback) {
                return (modules.soon.status)
                    ? CP_get.additional(
                    {"all_movies": process.env.CP_ALL},
                    'soon',
                    options,
                    function (err, movies) {
                        if (options.debug) {
                            options.debug.detail.push({"type": "soon", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                            options.debug.duration.current = new Date();
                        }
                        if (err) return callback(err);

                        return (movies && movies.length)
                            ? callback(null, movies)
                            : callback(null, [])
                    })
                    : callback(null, [])
            },
            "news": function (callback) {
                return (modules.content.status && modules.content.data.news.tags && modules.content.data.news.count)
                    ? CP_get.contents(
                        {"content_tags": modules.content.data.news.tags},
                        modules.content.data.news.count,
                        1,
                        true,
                        options,
                        function (err, contents) {
                            if (options.debug) {
                                options.debug.detail.push({"type": "news", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                                options.debug.duration.current = new Date();
                            }
                            if (err) return callback(err);

                            return (contents && contents.length)
                                ? callback(null, contents)
                                : callback(null, [])
                        })
                    : callback(null, [])
            },
            "recent": function (callback) {
                var service = [];
                if (modules.comments.data.disqus.shortname &&
                    modules.comments.data.disqus.recent.num_items &&
                    modules.comments.data.disqus.recent.display.indexOf('content')+1) {
                    service.push('disqus');
                }
                if (modules.comments.data.hypercomments.widget_id &&
                    modules.comments.data.hypercomments.recent.num_items &&
                    modules.comments.data.hypercomments.recent.display.indexOf('content')+1) {
                    service.push('hypercomments');
                }
                return (service.length)
                    ? CP_comments.recent(
                    service,
                    options,
                    function (err, comments) {
                        if (options.debug) {
                            options.debug.detail.push({"type": "recent", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                            options.debug.duration.current = new Date();
                        }
                        if (err) return callback(err);

                        return (comments)
                            ? callback(null, comments)
                            : callback(null, [])
                    })
                    : callback(null, [])
            },
            "indexer": function (callback) {
                return (modules.comments.data.disqus.api_key || modules.comments.data.hypercomments.sekretkey)
                    ? CP_comments.indexer(
                        config.protocol + options.domain + '/' + modules.content.data.url + '/' + url,
                        '/' + modules.content.data.url + '/' + url,
                        function (err, comments) {
                            if (options.debug) {
                                options.debug.detail.push({"type": "comments", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                                options.debug.duration.current = new Date();
                            }
                            if (err) return callback(err);

                            return (comments)
                                ? callback(null, comments)
                                : callback(null, '')
                        })
                    : callback(null, '')
            },
            "count": function (callback) {
                if (!query) return callback(null, 0);
                return CP_get.count(
                    query,
                    function (err, num) {
                        if (options.debug) {
                            options.debug.detail.push({"type": "count", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                            options.debug.duration.current = new Date();
                        }
                        if (err) return callback(err);

                        num = Math.ceil(parseInt(num)/config.default.count);

                        return (num)
                            ? callback(null, num)
                            : callback(null, 0)
                    });
            }
        },
        function(err, result) {

            if (err) return callback(err);

            for (var r in result) {
                if (result.hasOwnProperty(r) && result[r] === null) {
                    delete result[r];
                }
            }

            var indexer = (result.indexer) ? result.indexer : '';

            CP_page.content(result, url, page, sorting, options, function (err, result) {
                if (options.debug) {
                    options.debug.detail.push({"type": "page", "duration": (new Date() - options.debug.duration.current) + 'ms'});
                    options.debug.duration.current = new Date();
                }
                if (result.page.comments) {
                    result.page.comments = indexer + result.page.comments
                }
                callback(err, result);
            });

        });

}

module.exports = {
    "all" : allContents,
    "one" : oneContent
};