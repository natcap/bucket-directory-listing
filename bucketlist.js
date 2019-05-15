if (typeof AUTO_TITLE != 'undefined' && AUTO_TITLE == true) {
  document.title = location.hostname;
}

if (typeof GCSBL_IGNORE_PATH == 'undefined' || GCSBL_IGNORE_PATH != true) {
  var GCSBL_IGNORE_PATH = false;
}

if (typeof BUCKET_URL == 'undefined') {
  var BUCKET_URL = location.protocol + '//' + location.hostname;
}

if (typeof BUCKET_NAME != 'undefined') {
  // if bucket_url does not start with bucket_name,
  // assume path-style url
  if (!~BUCKET_URL.indexOf(location.protocol + '//' + BUCKET_NAME)) {
    BUCKET_URL += '/' + BUCKET_NAME;
  }
}

if (typeof GCSB_ROOT_DIR == 'undefined') {
  var GCSB_ROOT_DIR = '';
}

if (typeof GCSB_SORT == 'undefined') {
  var GCSB_SORT = 'DEFAULT';
}

if (typeof EXCLUDE_FILE == 'undefined') {
  var EXCLUDE_FILE = [];
} else if (typeof EXCLUDE_FILE == 'string') {
  var EXCLUDE_FILE = [EXCLUDE_FILE];
}

// just for dev, change underscore to dot for production
const location_hostname = 'localhost:8000'


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
  var rx = '.*[?&]prefix=' + GCSB_ROOT_DIR + '([^&]+)(&.*)?$';
  var prefix = '';
  if (GCSBL_IGNORE_PATH == false) {
    var prefix = loc.pathname.replace(/^\//, GCSB_ROOT_DIR);
  }
  // search current url for '?prefix='
  var match = loc.search.match(rx);
  if (match) {
    prefix = GCSB_ROOT_DIR + match[1];
  } else {
    if (GCSBL_IGNORE_PATH) {
      var prefix = GCSB_ROOT_DIR;
    }
  }
  return prefix;
}

function createS3QueryUrl(marker) {
  // Build an API query by parsing a url for prefix= query parameter
  // and append param to the rest API endpoint
  let gcs_rest_url = BUCKET_URL;
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
  const root = '<a href="/">' + location_hostname + '</a> / '; // todo '_' -> '.' for prodcution
  let content = [];
  let prefix = locationToPrefix(location)
  let processedPathSegments = ''
  if (prefix) {
  	content = prefix.split('/').map(function(pathSegment) {
	  	processedPathSegments =
	        processedPathSegments + pathSegment + '/'; // formerly encodeURIComponent(pathSegment)
	    return '<a href="/?prefix=' + processedPathSegments + '">' + pathSegment +
	             '</a>';	
	    });
    document.getElementById('navigation').innerHTML = root + content.join(' / ');
  } else {
    document.getElementById('navigation').innerHTML = root;
  }
}

function prepareTable(info) {
	let dirs = info.prefixes
	let files = info.items 
	var content = [];
	var cols = [45, 30, 15];
	content.push(padRight('Last Modified', cols[1]) + '  ' + 
		padRight('Size', cols[2]) + 'Key \n');
	content.push(new Array(cols[0] + cols[1] + cols[2] + 4).join('-') + '\n');

  // add ../ at the start of the dir listing, unless we are already at root dir
  // if (prefix && prefix !== GCSB_ROOT_DIR) {
  //   var up = prefix.replace(/\/$/, '').split('/').slice(0, -1).concat('').join(
  //           '/'),  // one directory up
  //       item =
  //           {
  //             Key: up,
  //             LastModified: '',
  //             ETag: '',
  //             Size: '',
  //             keyText: '../',
  //             href: GCSBL_IGNORE_PATH ? '?prefix=' + up : '../'
  //           },
  //       row = renderRow(item, cols);
  //   content.push(row + '\n');
  // }

  	if (dirs){
		dirs.forEach(function(dirname) {
		  	let item = {
				Key: 'dirkey',
				LastModified: '',
				Size: '',
				keyText: dirname,
				href: location.protocol + '//' + location_hostname +
                    location.pathname + '?prefix=' + dirname
		  	}
		  	var row = renderRow(item, cols);
		    // if (!EXCLUDE_FILE.includes(item.Key))
			content.push(row + '\n');
		});
  	}
 //  	if (GCSBL_IGNORE_PATH) {
 //        item.href = location.protocol + '//' + location.hostname +
 //                    location.pathname + '?prefix=' + item.Key;
	// } else {
	// item.href = item.keyText;
	// }
	if (files) {
		files.forEach(function(file) {
		  	let item = {
				Key: 'filekey',
				LastModified: file.updated,
				Size: bytesToHumanReadable(file.size),
				keyText: file.name,
				href: file.mediaLink
		  	}
		  	var row = renderRow(item, cols);
		    // if (!EXCLUDE_FILE.includes(item.Key))
			content.push(row + '\n');
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