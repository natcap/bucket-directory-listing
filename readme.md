This is an apache-like directory listing site for a google bucket. It can be deployed to any bucket with a public domain.  It's an adaptation of https://github.com/rufuspollock/s3-bucket-listing.  

## Development:
Fire up your favorite http server and make sure the domain and port are listed in `config.js`.  `localhost:8080` is already setup in `config.js`.

For example, `npx http-server .`

## Configure:  
make sure `config.js` has a listing for the bucket where you wish to deploy

## Deploy: 
`cd bucket-directory-listing`  
`gsutil -m rsync . gs://releases.naturalcapitalproject.org`
