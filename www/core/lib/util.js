// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.core')

/**
 * Provider with some 'util' functionalities.
 *
 * @module mm.core
 * @ngdoc provider
 * @name $mmUtil
 */
.provider('$mmUtil', function() {

    var self = this; // Use 'self' to be coherent with the rest of services.

    /**
     * Serialize an object to be used in a request.
     *
     * @module mm.core
     * @ngdoc method
     * @name $mmUtilProvider#param
     * @param  {Object} obj Object to serialize.
     * @return {String}     Serialization of the object.
     */
    self.param = function(obj) {
        var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

        for (name in obj) {
            value = obj[name];

            if (value instanceof Array) {
                for (i = 0; i < value.length; ++i) {
                    subValue = value[i];
                    fullSubName = name + '[' + i + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += self.param(innerObj) + '&';
                }
            }
            else if (value instanceof Object) {
                for (subName in value) {
                    subValue = value[subName];
                    fullSubName = name + '[' + subName + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += self.param(innerObj) + '&';
                }
            }
            else if (value !== undefined && value !== null) query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
        }

        return query.length ? query.substr(0, query.length - 1) : query;
    };

    function mmUtil($ionicLoading, $ionicPopup, $translate, $http, $log, $mmApp, $q) {

        $log = $log.getInstance('$mmUtil');

        var self = this, // Use 'self' to be coherent with the rest of services.
            countries;

        // // Loading all the mimetypes.
        var mimeTypes = {};
        $http.get('core/assets/mimetypes.json').then(function(response) {
            mimeTypes = response.data;
        }, function() {
            // It failed, never mind...
        });

        /**
         * Formats a URL, trim, lowercase, etc...
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#formatURL
         * @param  {String} url The url to be formatted.
         * @return {String}     Fromatted url.
         */
        self.formatURL = function(url) {

            url = url.trim();

            // Check if the URL starts by http or https.
            if (! /^http(s)?\:\/\/.*/i.test(url)) {
                // Test first allways https.
                url = "https://" + url;
            }

            // http allways in lowercase.
            url = url.replace(/^http/i, 'http');
            url = url.replace(/^https/i, 'https');

            // Replace last slash.
            url = url.replace(/\/$/, "");

            return url;
        };

        /**
         * Returns the file extension of a file.
         *
         * When the file does not have an extension, it returns undefined.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#getFileExtension
         * @param  {string} filename The file name.
         * @return {string}          The lowercased extension, or undefined.
         */
        self.getFileExtension = function(filename) {
            var dot = filename.lastIndexOf("."),
                ext;

            if (dot > -1) {
                ext = filename.substr(dot + 1).toLowerCase();
            }

            return ext;
        };

        /**
         * Get a file icon URL based on its file name.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#getFileIcon
         * @param  {String} The name of the file.
         * @return {String} The path to a file icon.
         */
        self.getFileIcon = function(filename) {
            var ext = self.getFileExtension(filename),
                icon;

            if (ext && mimeTypes[ext] && mimeTypes[ext].icon) {
                icon = mimeTypes[ext].icon + '-64.png';
            } else {
                icon = 'unknown-64.png';
            }

            return 'img/files/' + icon;
        };

        /**
         * Get the folder icon URL.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#getFolderIcon
         * @return {String} The path to a folder icon.
         */
        self.getFolderIcon = function() {
            return 'img/files/folder-64.png';
        };

        /**
         * Validates a URL for a specific pattern.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#isValidURL
         * @param {String} url The url to test against the pattern
         * @return {Boolean}   TRUE if the url matches the expected pattern.
         *                     FALSE otherwise.
         */
        self.isValidURL = function(url) {
            return /^http(s)?\:\/\/([\da-zA-Z\.-]+)\.([\da-zA-Z\.]{2,6})([\/\w \.-]*)*\/?/i.test(url);
        };

        /**
         * Generic function for adding the wstoken to Moodle urls and for pointing to the correct script.
         * For download remote files from Moodle we need to use the special /webservice/pluginfile passing
         * the ws token as a get parameter.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#fixPluginfileURL
         * @param {String} url   The url to be fixed.
         * @param {String} token Token to use.
         * @return {String}      Fixed URL.
         */
        self.fixPluginfileURL = function(url, token) {

            // This function is used in regexp callbacks, better not to risk!!
            if (!url) {
                return '';
            }

            // First check if we need to fix this url or is already fixed.
            if (url.indexOf('token=') != -1) {
                return url;
            }

            // Check if is a valid URL (contains the pluginfile endpoint).
            if (url.indexOf('pluginfile') == -1) {
                return url;
            }

            if (!token) {
                return '';
            }

            // In which way the server is serving the files? Are we using slash parameters?
            if (url.indexOf('?file=') != -1) {
                url += '&';
            } else {
                url += '?';
            }
            url += 'token=' + token;

            // Some webservices returns directly the correct download url, others not.
            if (url.indexOf('/webservice/pluginfile') == -1) {
                url = url.replace('/pluginfile', '/webservice/pluginfile');
            }
            return url;
        };

        /**
         * Open a file using platform specific method.
         *
         * node-webkit: Using the default application configured.
         * Android: Using the WebIntent plugin.
         * iOs: Using the window.open method.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#openFile
         * @param  {String} path The local path of the file to be open.
         * @return {Void}
         */
        self.openFile = function(path) {

            if (false) {
                // TODO Restore node-webkit support.

                // Link is the file path in the file system.
                // We use the node-webkit shell for open the file (pdf, doc) using the default application configured in the os.
                // var gui = require('nw.gui');
                // gui.Shell.openItem(path);

            } else if (window.plugins) {
                var extension = self.getFileExtension(path),
                    mimetype;

                if (extension && mimeTypes[extension]) {
                    mimetype = mimeTypes[extension];
                }

                if (ionic.Platform.isAndroid() && window.plugins.webintent) {
                    var iParams = {
                        action: "android.intent.action.VIEW",
                        url: path,
                        type: mimetype};

                    window.plugins.webintent.startActivity(
                        iParams,
                        function() {
                            $log.debug('Intent launched');
                        },
                        function() {
                            $log.debug('Intent launching failed');
                            $log.debug('action: ' + iParams.action);
                            $log.debug('url: ' + iParams.url);
                            $log.debug('type: ' + iParams.type);
                            // This may work in cordova 2.4 and onwards.
                            window.open(path, '_system');
                        }
                    );

                } else if (ionic.Platform.isIOS() && typeof handleDocumentWithURL == 'function') {

                    var fsRoot = $mmFS.getRoot();
                    // Encode/decode the specific file path, note that a path may contain directories
                    // with white spaces, special characters...
                    if (path.indexOf(fsRoot > -1)) {
                        path = path.replace(fsRoot, "");
                        path = encodeURIComponent(decodeURIComponent(path));
                        path = fsRoot + path;
                    }

                    handleDocumentWithURL(
                        function() {
                            $log.debug('File opened with handleDocumentWithURL' + path);
                        },
                        function(error) {
                            $log.debug('Error opening with handleDocumentWithURL' + path);
                            if(error == 53) {
                                $log.error('No app that handles this file type.');
                            }
                            self.openFileWithBrowser(path);
                        },
                        path
                    );
                } else {
                    // Last try, launch the file with the browser.
                    self.openFileWithBrowser(path);
                }
            } else {
                // Changing _blank for _system may work in cordova 2.4 and onwards.
                $log.debug('Opening external file using window.open()');
                window.open(path, '_blank');
            }
        };

        /**
         * Open a file using a browser.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#_openFileWithBrowser
         * @param  {String} path The local path of the file to be open.
         * @return {Void}
         */
        self.openFileWithBrowser = function(path) {
            if ($mmApp.canUseChildBrowser()) {
                $log.debug('Launching childBrowser');
                try {
                    window.plugins.childBrowser.showWebPage(
                        path,
                        {
                            showLocationBar: true ,
                            showAddress: false
                        }
                    );
                } catch(e) {
                    $log.debug('Launching childBrowser failed!, opening as standard link.');
                    window.open(path, '_blank');
                }
            } else {
                // Changing _blank for _system may work in cordova 2.4 and onwards.
                $log.debug('Open external file using window.open()');
                window.open(path, '_blank');
            }
        };

        /**
         * Displays a loading modal window
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#showModalLoading
         * @param {string} title The text of the modal window
         */
        self.showModalLoading = function(text) {
            $ionicLoading.show({
                template: '<i class="icon ion-load-c"> '+text
            });
        };

        /**
         * Close a modal loading window.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#closeModalLoading
         */
        self.closeModalLoading = function() {
            $ionicLoading.hide();
        };

        /**
         * Show a modal with an error message.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#showErrorModal
         * @param {String} errorMessage    Message to show.
         * @param {Boolean} needsTranslate True if the errorMessage is a $translate key, false otherwise.
         */
        self.showErrorModal = function(errorMessage, needsTranslate) {
            var langKeys = ['mm.core.error'];
            if (needsTranslate) {
                langKeys.push(errorMessage);
            }

            $translate(langKeys).then(function(translations) {
                $ionicPopup.alert({
                    title: translations.error,
                    template: needsTranslate ? translations[errorMessage] : errorMessage
                });
            });
        };

        /**
         * Show a modal with an error message.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#showModal
         * @param {String} title        Language key.
         * @param {String} message      Language key.
         */
        self.showModal = function(title, message) {
            var promises = [
                $translate(title),
                $translate(message),
            ];

            $q.all(promises).then(function(translations) {
                $ionicPopup.alert({
                    title: translations[0],
                    template: translations[1]
                });
            });
        };

        /**
         * Function to clean HTML tags.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#cleanTags
         * @param  {String} text The text to be cleaned.
         * @return {String}      Text cleaned.
         */
        self.cleanTags = function(text) {
            // First, we use a regexpr.
            text = text.replace(/(<([^>]+)>)/ig,"");
            // Then, we rely on the browser. We need to wrap the text to be sure is HTML.
            // text = $("<p>" + text + "</p>").text();
            // Recover new lines.
            text = text.replace(/(?:\r\n|\r|\n)/g, '<br />');
            return text;
        };

        /**
         * Reads and parses a JSON file.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#readJSONFile
         * @param  {String} path Path to the file.
         * @return {Promise}     Promise to be resolved when the file is parsed.
         */
        self.readJSONFile = function(path) {
            return $http.get(path).then(function(response) {
                return response.data;
            });
        };

        /**
         * Formats a user address, concatenating address, city and country.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#formatUserAddress
         * @param  {String} address Address.
         * @param  {String} city    City..
         * @param  {String} country Country.
         * @return {String}         Formatted address.
         */
        self.formatUserAddress = function(address, city, country) {
            if (address) {
                address += city ? ', ' + city : '';
                address += country ? ', ' + country : '';
            }
            return address;
        };

        /**
         * Formats a user role list, translating and concatenating them.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#formatUserRoleList
         * @param  {Array} roles List of user roles.
         * @return {Promise}     Promise resolved with the formatted roles (string).
         */
        self.formatUserRoleList = function(roles) {
            var deferred = $q.defer();

            if (roles && roles.length > 0) {
                $translate('mma.participants.roleseparator').then(function(separator) {
                    var rolekeys = roles.map(function(el) {
                        return 'mma.participants.'+el.shortname; // Set the string key to be translated.
                    });

                    $translate(rolekeys).then(function(roleNames) {
                        var roles = '';
                        for (var roleKey in roleNames) {
                            var roleName = roleNames[roleKey];
                            if (roleName.indexOf('mma.participants.') > -1) {
                                // Role name couldn't be translated, leave it like it was.
                                roleName = roleName.replace('mma.participants.', '');
                            }
                            roles += (roles != '' ? separator+' ' : '') + roleName;
                        }
                        deferred.resolve(roles);
                    });
                });
            } else {
                deferred.resolve('');
            }
            return deferred.promise;
        };

        /**
         * Get the countries list.
         *
         * @module mm.core
         * @ngdoc method
         * @name $mmUtil#getCountries
         * @return {Promise} Promise to be resolved when the list is retrieved.
         */
        self.getCountries = function() {
            var deferred = $q.defer();

            if (typeof(countries) !== 'undefined') {
                deferred.resolve(countries);
            } else {
                self.readJSONFile('core/assets/countries.json').then(function(data) {
                    countries = data;
                    deferred.resolve(countries);
                }, function(){
                    deferred.resolve();
                });
            }

            return deferred.promise;
        };
    }

    self.$get = function($ionicLoading, $ionicPopup, $translate, $http, $log, $mmApp, $q) {
        return new mmUtil($ionicLoading, $ionicPopup, $translate, $http, $log, $mmApp, $q);
    };
});