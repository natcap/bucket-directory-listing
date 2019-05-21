function readLatestInstallers(redirect_lookup) {
  // load json object that stores URLs for the latest installers
  let redirections = fetch(redirect_lookup)
    .then(function(response){
      if (response.status === 200){
        return response.json()
      } else {
        console.log(response.status);
      }
    })
  return redirections;
}

async function locationHashRedirect(redirect_lookup_json) {
  // trigger redirect to download a file given a special hash URL
  // if the URL doesn't match, load directory listing as normal.
  let redirections = await readLatestInstallers(redirect_lookup_json)
  if (typeof redirections !== 'undefined') {
    if (Object.keys(redirections).includes(location.hash)) {
      window.location.href = redirections[location.hash]
    }
  }
}

import { listing_config } from './config.js';
var CONFIG = listing_config[location.host]
window.onhashchange = locationHashRedirect(CONFIG.special_bucket_objects)


// test
// given a json file and a url string with a hash
// expect that window.location.href goes to the correct bucket file.