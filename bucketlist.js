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

function getS3Data(marker, html) {
  let gcs_rest_url = createS3QueryUrl(marker);
  fetch(gcs_rest_url)
  	// todo check if response was truncated because of too many objects
  	.then(function(response) {
	  	return response.json();
  	})
  	.then(function(data) {
  		buildNavigation(data);
  		html = typeof html !== 'undefined' ? html + prepareTable(data) :
                                             prepareTable(data);

		document.getElementById('listing').innerHTML = 
			'<pre>' + html + '</pre>';
  	})
}

function locationToPrefix(loc) {
  // Parse the current URL for a prefix= parameter value to attach
  // to links or append to rest API query
  let rx = '.*[?&]prefix=' + CONFIG.root_dir + '([^&]+)(&.*)?$';
  let prefix = '';
  prefix = loc.pathname.replace(/^\//, CONFIG.root_dir);
  let match = loc.search.match(rx); // search current url for '?prefix='
  if (match) {
    prefix = CONFIG.root_dir + match[1];
  } 
  return prefix;
}

function createS3QueryUrl(marker) {
  // Build an API query by parsing a url for prefix= query parameter
  // and append param to the rest API endpoint
  let gcs_rest_url = CONFIG.bucket_url;
  gcs_rest_url += '?delimiter=/';
  let prefix = locationToPrefix(location);
  if (prefix) {
    // make sure we end in /
    prefix = prefix.replace(/\/$/, '') + '/';
    gcs_rest_url += '&prefix=' + encodeURIComponent(prefix);
  }
  if (marker) {
    gcs_rest_url += '&marker=' + marker;
  }
  return gcs_rest_url;
}

function buildNavigation(info) {
  // Build links that can be parsed for a prefix= query parameter.
  const root = '<a href="/">' + location.host + '</a> / '; // todo '_' -> '.' for prodcution
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

function prepareTable(info) {
  // info is the json API response.
  // Returns html.
	let dirs = info.prefixes
	let files = info.items 
	let content = [];
	const cols = [45, 30, 15];
	content.push(padRight('Last Modified', cols[1]) + '  ' + 
		padRight('Size', cols[2]) + 'Key \n');
	content.push(new Array(cols[0] + cols[1] + cols[2] + 4).join('-') + '\n');

  // add ../ at the start of the dir listing, unless we are already at root dir
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

  // dirs or 'prefixes' have no size or date and are already ordered by name
	if (dirs) {
		dirs.forEach(function(dirname) {
	  	let item = {
				Key: dirname,
				LastModified: '',
				Size: '',
				keyText: dirname,
				href: location.protocol + '//' + location.host +
              location.pathname + '?prefix=' + dirname
	  	}
	  	let row = renderRow(item, cols);
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
				keyText: file.name,
				href: file.mediaLink
	  	}
	  	let row = renderRow(item, cols);
	    if (!CONFIG.exclude_files.includes(item.Key)){
        content.push(row + '\n');
      }
		});
	}
  return content.join('');
}

function renderRow(item, cols) {
  var row = '';
  row += padRight(item.LastModified, cols[1]) + '  ';
  row += padRight(item.Size, cols[2]);
  row += '<a href="' + item.href + '">' + item.keyText + '</a>';
  return row;
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

getS3Data();

