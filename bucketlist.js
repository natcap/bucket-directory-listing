import { listing_config } from './config.js';
var CONFIG = listing_config[location.host]

if (typeof AUTO_TITLE !== 'undefined' && AUTO_TITLE === true) {
  document.title = location.host;
}

if (typeof CONFIG.bucket_url === 'undefined') {
  CONFIG.bucket_url = location.protocol + '//' + location.host;
}

if (typeof CONFIG.root_dir === 'undefined') {
  CONFIG.root_dir = '';
}

if (typeof CONFIG.sort_option === 'undefined') {
  CONFIG.sort_option = 'A2Z';
}

if (typeof CONFIG.exclude_files === 'undefined') {
  CONFIG.exclude_files = [];
} else if (typeof CONFIG.exclude_files === 'string') {
  CONFIG.exclude_files = [CONFIG.exclude_files];
}

function isRelease(str) {
  return str.split('.').length === 3
}

function sortFilesFunction(a, b) {
  switch (CONFIG.sort_option) {
    case "A2Z":
      return a.name.localeCompare(b.name);
    case "Z2A":
      return a.name.localeCompare(b.name) * -1;
    case "BIG2SMALL":
      return a.size / 1 < b.size / 1 ? 1 : -1;
    case "SMALL2BIG":
      return a.size / 1 > b.size / 1 ? 1 : -1;
  }
}

const sortFuncs = {
  semver: function(a, b) {
    const semverA = a.split('/').slice(-2).join('').split('.');
    const semverB = b.split('/').slice(-2).join('').split('.');

    for (let i = 0; i < 3; i++) {
      if (semverA[i] !== semverB[i]) {
        const numA = Number(semverA[i]);
        const numB = Number(semverB[i]);
        if (isNaN(numA)) { return 1 }
        if (isNaN(numB)) { return -1 }
        return numA < numB ? 1 : -1
      }
    }
    let postA = semverA[3] ? semverA[3] : 0;
    let postB = semverB[3] ? semverB[3] : 0;
    if (postA === 0) { return 1 };
    if (postB === 0) { return -1 };
    postA = Number(semverA[3].split('+')[0].replace('post', ''));
    postB = Number(semverB[3].split('+')[0].replace('post', ''));
    return postA < postB ? 1 : -1
  }
}

function padRight(padString, length) {
  var str = padString.slice(0, length - 3);
  if (padString.length > str.length) {
    str += '...';
  }
  while (str.length < length) {
    str = str + ' ';
  }
  return str;
}

function bytesToHumanReadable(sizeInBytes) {
  var i = -1;
  var units = [' kB', ' MB', ' GB'];
  do {
    sizeInBytes = sizeInBytes / 1024;
    i++;
  } while (sizeInBytes > 1024);
  return Math.max(sizeInBytes, 0.1).toFixed(1) + units[i];
}

function locationToPrefix(loc) {
  // Parse the current URL for a prefix= parameter value to attach
  // to links or append to API query
  let rx = '.*[?&]prefix=' + CONFIG.root_dir + '([^&]+)(&.*)?$';
  let prefix = '';
  prefix = loc.pathname.replace(/^\//, CONFIG.root_dir);
  let match = loc.search.match(rx); // search current url for '?prefix='
  if (match) {
    prefix = CONFIG.root_dir + match[1];
  } 
  return prefix;
}

function buildNavigation() {
  // Build links that can be parsed for a 'prefix=' query parameter.
  const root = '<a href="/">' + location.host + '</a> / ';
  let content = [];
  let prefix = locationToPrefix(location)
  let processedPathSegments = ''
  if (prefix) {
    content = prefix.split('/').map(function(pathSegment) {
      processedPathSegments =
          processedPathSegments + pathSegment + '/';
      return '<a href="/?prefix=' + processedPathSegments + '">' + pathSegment +
               '</a>';  
      });
    document.getElementById('navigation').innerHTML = root + content.join(' / ');
  } else {
    document.getElementById('navigation').innerHTML = root;
  }
}

function renderRow(item, cols, isSubheader) {
  var row = '';
  row += padRight(item.LastModified, cols[1]) + '  ';
  row += padRight(item.Size, cols[2]);
  row += '<a href="' + item.href + '">' + item.keyText + '</a>';
  if (!isSubheader) {
    return row
  }
  return `<h4>${row}</h4>`;
}

function prepareTableHeader() {
  // Last Modified                   Size           Key 
  // ---------------------------------------------------
  //                                                ../

  let content = [];
  const cols = COLS;
  content.push(padRight('Last Modified', cols[1]) + '  ' + 
    padRight('Size', cols[2]) + 'Key \n');
  content.push(new Array(cols[0] + cols[1] + cols[2] + 4).join('-') + '\n');
  let prefix = locationToPrefix(location)
  if (prefix && prefix !== CONFIG.root_dir) {
    var up = prefix.replace(/\/$/, '').split('/').slice(0, -1).concat('').join(
            '/'),  // one directory up
        item =
            {
              Key: up,
              LastModified: '',
              ETag: '',
              Size: '',
              keyText: '../',
              href: location.protocol + '//' + location.host +
                    location.pathname + '?prefix=' + up
            },
        row = renderRow(item, cols);
    content.push(row + '\n');
  }
  return content.join('');
}

function prepareTable(info, sortFunc) {
  // info is the json API response.
  // Returns preformatted text for use inside <pre></pre> tags
  let dirs = info.prefixes
  let files = info.items 
  let content = [];
  const cols = COLS;
  
  // dirs or 'prefixes' have no size or date and are already ordered by name
  if (dirs) {
    if (sortFunc) {
      let sortedDirs = dirs;
      sortedDirs.sort(sortFunc);
      dirs = sortedDirs;
    }
    dirs.forEach(function(dirname) {
      let item = {
        Key: dirname,
        LastModified: '',
        Size: '',
        keyText: dirname.split('/').slice(-2).join('/'), // dirname has a trailing slash
        href: location.protocol + '//' + location.host +
              location.pathname + '?prefix=' + dirname
      }
      const isSubheader = isRelease(item.keyText);
      let row = renderRow(item, cols, isSubheader);
      if (!CONFIG.exclude_files.includes(item.Key)) {
        content.push(row + '\n');
      }
    });
  }

  // files or 'items' have various properties and no obvious default ordering
  if (files) {
    if (CONFIG.sort_option !== 'DEFAULT') {
      let sortedFiles = files;
      sortedFiles.sort(sortFilesFunction);
      files = sortedFiles;
    }
    files.forEach(function(file) {
      let item = {
        Key: file.name,
        LastModified: file.updated,
        Size: bytesToHumanReadable(file.size),
        keyText: file.name.split('/').pop(),
        href: `${CONFIG.public_url}/${file.name}`
      }
      let row = renderRow(item, cols);
      if (!CONFIG.exclude_files.includes(item.Key)){
        content.push(row + '\n');
      }
    });
  }
  return content.join('');
}

// objects are compared to offset ranges in lexicographic order.
// These ranges ensure no overlap among each other,
// and allow for 989 bugfix versions per minor version.
const INVEST_OFFSETS = [
  ['3.0.0', '3.0.99'],
  ['3.1.0', '3.1.99'],
  ['3.2.0', '3.2.99'],
  ['3.3.0', '3.3.99'],
  ['3.4.0', '3.4.99'],
  ['3.5.0', '3.5.99'],
  ['3.6.0', '3.6.99'],
  ['3.7.0', '3.7.99'],
  ['3.8.0', '3.8.99'],
  ['3.9.0', '3.9.99'],
  ['3.10.0', '3.10.99'],
  ['3.11.0', '3.11.99'],
  ['3.12.0', '3.12.99'],
  ['3.13.0', '3.13.99'],
  ['3.14.0', '3.14.99'],
  ['3.15.0', '3.15.99'],
  ['3.16.0', '3.16.99'],
  ['3.17.0', '3.17.99'],
  ['3.18.0', '3.18.99'],
  ['3.19.0', '3.19.99'],
  ['3.20.0', '3.20.99'],
  ['3.21.0', '3.21.99'],
  ['3.22.0', '3.22.99'],
  ['3.23.0', '3.23.99'],
  ['3.24.0', '3.24.99'],
  ['3.25.0', '3.30.99'],
  ['3.31.0', '3.99.99'],
  ['4.0.0', '9.0.0'],
]

function getS3Data(pageToken, startOffset, endOffset, storageObjects={prefixes: [], items: []}) {
  // fetches JSON format bucket metadata from bucket's endpoint.
  // all parameters are optional
  // pageToken should be used in conjunction with the same start and endOffset
  // that were used in the prior query that returned the nextPageToken.
  const maxResults = 1000;
  let objects = {prefixes: [], items: []};
  Object.assign(objects, storageObjects);
  let gcs_rest_url = CONFIG.bucket_url;
  let urlArray = [];
  let prefix = locationToPrefix(location);
  gcs_rest_url += '?delimiter=/';

  if (prefix) {
    // make sure we end in /
    prefix = prefix.replace(/\/$/, '') + '/';
    gcs_rest_url += '&prefix=' + encodeURIComponent(prefix);
  }
  if (maxResults) {
    gcs_rest_url += '&maxResults=' + maxResults
  }
  if (pageToken) {
    gcs_rest_url += '&pageToken=' + pageToken
    if (startOffset) {
      gcs_rest_url += `&startOffset=${startOffset}`
    }
    if (endOffset) {
      gcs_rest_url += `&endOffset=${endOffset}`
    }
    urlArray.push(gcs_rest_url);
  } else if (prefix == 'invest/') {
      urlArray = INVEST_OFFSETS.map(([start, end]) => {
        let url = gcs_rest_url;
        url += `&startOffset=invest/${start}`
        url += `&endOffset=invest/${end}`
        return url;
      })
  } else {
    urlArray.push(gcs_rest_url);
  }

  Promise.all(urlArray.map(url => fetch(url)))
    .then((responses) => {
      Promise.all(responses.map(response => {
        if (response.status === 200) {
          return response.json();  
        } else {
          console.log(response.status);
        }
      }))
      .then((dataArray) => {
        dataArray.forEach((data, idx) => {
          if (data.prefixes) {
            objects['prefixes'].push(...data['prefixes'])
          }
          if (data.items) {
            objects['items'].push(...data['items'])
          }
          if (data.nextPageToken) {
            const params = new URLSearchParams(urlArray[idx]);
            const startOffset = params.get('startOffset');
            const endOffset = params.get('endOffset');
            getS3Data(data.nextPageToken, startOffset, endOffset, objects)
          }
        });
      })
      .then(() => {
        const html = prepareTable(objects, sortFuncs[sortName]);
        document.getElementById('listing')
          .innerHTML = '<pre>' + prepareTableHeader() + html + '</pre>';
      })
    })
    buildNavigation();
    const sortName = CONFIG.prefix_sort_map[
      prefix.split('/').slice(-2).join('/')
    ];
}

const COLS = [45, 30, 15];
getS3Data();

