This is an apache-like directory listing site for a google bucket. It can be deployed to any bucket with a public domain.  It's an adaptation of https://github.com/rufuspollock/s3-bucket-listing.  

## Development:
Fire up your favorite http server and make sure the domain and port are listed in `config.js`.  `localhost:8080` is already setup in `config.js`.

For example, `npx http-server .`

## Configure:  
make sure `config.js` has a listing for the bucket where you wish to deploy

## Deploy: 
`cd bucket-directory-listing`  
`gsutil -m rsync -n . gs://releases.naturalcapitalproject.org`

After deploying I needed to manually edit the "Type" of the javascript files.
By default they receive "text/plain". The file's metadata can be
edited to change the content type to "application/javascript", which is
necessary for the client browser to accept them. I don't recall needing
to do this in the past.
