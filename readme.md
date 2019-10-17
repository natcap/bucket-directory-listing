This is an apache-like directory listing site for a google bucket. It can be deployed to any bucket with a public domain.  It's an adaptation of https://github.com/rufuspollock/s3-bucket-listing.  

## Development:
Fire up your favorite http server and make sure the domain and port are listed in `config.js`.  
`localhost:8000` is already setup in `config.js`.

## Configure:  
make sure `config.js` has a listing for the bucket where you wish to deploy

## Deploy: 
`cd bucket-directory-listing`  
`gsutil -m rsync . gs://releases.naturalcapitalproject.org`

## Notes:  
`fragment_id_redirect.js` is included in the deployed site by default. It enables static 'fragment identifiers' (e.g. #some-string) in URLs to point to special files(objects), whose names change frequently.  

The identifiers and object names are specified in a file called fragment_id_redirections.json that should live in the bucket's root.
```
{
  "#latest-invest-windows": "http://releases.naturalcapitalproject.org/invest/3.7.0/InVEST_3.7.0_x86_Setup.exe",
  "#latest-invest-mac": "http://releases.naturalcapitalproject.org/invest/3.7.0/InVEST-3.7.0-mac.zip",
  "#latest-invest-userguide": "http://releases.naturalcapitalproject.org/invest-userguide/latest/"
}
```