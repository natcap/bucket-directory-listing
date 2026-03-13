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
    // split into <major>.<minor>.<bugfix>.<post / dev>
    const semverA = a.split('/').slice(-2).join('').split('.');
    const semverB = b.split('/').slice(-2).join('').split('.');

    // simple comparison based on major, minor, bugfix numbers
    for (let i = 0; i < 3; i++) {
      if (semverA[i] !== semverB[i]) {
        const numA = Number(semverA[i]);
        const numB = Number(semverB[i]);

        // an 'a' for alpha is part of the bugfix number on rare occassions
        // if it's NaN, just don't bother trying
        if (isNaN(numA)) { return 1 }
        if (isNaN(numB)) { return -1 }
        
        return numA < numB ? 1 : -1
      }
    }
    // if versions are the same down to the bugfix,
    let suffixA = semverA[3] ? semverA[3] : '';
    let suffixB = semverB[3] ? semverB[3] : '';
    if (suffixA.startsWith('post') || suffixB.startsWith('post')) {
      // 3.4.5.post* goes after 3.4.5
      if (suffixA === '') { return 1 };
      if (suffixB === '') { return -1 };
    }
    if (suffixA.startsWith('dev') || suffixB.startsWith('dev')) {
      // 3.4.5.dev* goes before 3.4.5
      if (suffixA === '') { return -1 };
      if (suffixB === '') { return 1 };
    }
    const intA = Number(suffixA.split('+')[0].replace(/post|dev/, ''));
    const intB = Number(suffixB.split('+')[0].replace(/post|dev/, ''));
    return intA < intB ? 1 : -1
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
  console.log('building navigation');
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
  console.log('preparing table');
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
// and minimize the need for sequential, paginated requests.
// Start is inclusive, end is not, hence the trailing z.
const INVEST_OFFSETS = [
  ['3.6.0', '3.6.9z'],
  ['3.7.0', '3.7.9z'],
  ['3.8.0', '3.8.9z'],
  ['3.9.0', '3.9.9z'],
  ['3.10.0', '3.10.9z'],
  ['3.11.0', '3.11.9z'],
  ['3.12.0', '3.12.9z'],
  ['3.13.0', '3.13.9z'],
  ['3.14.0', '3.14.0z'],
  ['3.14.1', '3.14.1z'],
  ['3.14.2', '3.14.2z'],
  ['3.14.3', '3.14.9z'],
  ['3.15.0', '3.15.9z'],
  ['3.16.0', '3.16.0z'],
  ['3.16.1', '3.16.1z'],
  ['3.16.2', '3.16.2z'],
  ['3.16.3', '3.16.9z'],
  ['3.17.0', '3.17.0z'],
  ['3.17.1', '3.17.1z'],
  ['3.17.2', '3.17.2z'],
  ['3.17.3', '3.17.9z'],
  ['3.18.0', '3.18.9z'],
  ['3.19.0', '3.19.9z'],
  ['3.20.0', '3.20.9z'],
  ['3.21.0', '3.21.9z'],
  ['3.22.0', '3.22.9z'],
  ['3.23.0', '3.23.9z'],
  ['3.24.0', '3.24.9z'],
  ['3.25.0', '3.29.9z'],
  ['3.30.0', '3.39.9z'],
  ['3.40.0', '3.49.9z'],
  ['3.50.0', '3.59.9z'],
  ['3.60.0', '3.69.9z'],
  ['3.70.0', '3.79.9z'],
  ['3.80.0', '3.89.9z'],
  ['3.90.0', '3.99.9z'],
  ['4.0.0', '9z'],
]

function getBucketData(pageToken, offsetRange, storageObjects={prefixes: [], items: []}) {
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
    if (offsetRange) {
      gcs_rest_url += `&startOffset=${offsetRange[0]}`
      gcs_rest_url += `&endOffset=${offsetRange[1]}`
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
  if (!URL_ARRAY) {
    URL_ARRAY = Object.assign([], urlArray);
  }

  const sortName = CONFIG.prefix_sort_map[
    prefix.split('/').slice(-2).join('/')
  ];

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
          const params = new URLSearchParams(urlArray[idx]);
          if (data.nextPageToken) {
            const startOffset = params.get('startOffset');
            const endOffset = params.get('endOffset');
            getBucketData(data.nextPageToken, [startOffset, endOffset], objects)
          } else {
            const previousToken = params.get('pageToken');
            const originalUrl = urlArray[idx].replace(`&pageToken=${previousToken}`, '');
            URL_ARRAY = URL_ARRAY.filter(item => item !== originalUrl);
          }
        });
      })
      .then(() => {
        if (!URL_ARRAY.length) {
          const html = prepareTable(objects, sortFuncs[sortName]);
          document.getElementById('listing')
            .innerHTML = '<pre>' + prepareTableHeader() + html + '</pre>';
        }
      })
    })
}

const COLS = [45, 30, 15];
let URL_ARRAY;
getBucketData();
buildNavigation();
