var listing_config = {
	"releases.naturalcapitalproject.org": { // public domain of a bucket
		bucket_url: "https://www.googleapis.com/storage/v1/b/releases.naturalcapitalproject.org/o",
		public_url: "https://storage.googleapis.com/releases.naturalcapitalproject.org",
		exclude_files: ["index.html", "bucketlist.js", "fragment_id_redirect.js", "fragment_id_redirections.json", "config.js", "readme.md" , "robots.txt"],
		// If entries under a special prefix should be sorted in a special way
		prefix_sort_map: {
			"invest": "semver"
		},
		// sort_option: "A2Z", // 'A2Z', 'Z2A', 'BIG2SMALL', 'SMALL2BIG'
		// root_dir: "invest/",
		special_bucket_objects: "fragment_id_redirections.json" // (optional) create special URLs that redirect to objects: {"#latest-invest-windows": "http://releases.naturalcapitalproject.org/invest/3.7.0/InVEST_3.7.0_x86_Setup.exe"}
	},
	"localhost:8000": { // another bucket domain, this one convenient for local development.
		bucket_url: "https://www.googleapis.com/storage/v1/b/releases.naturalcapitalproject.org/o",
		public_url: "https://storage.googleapis.com/releases.naturalcapitalproject.org",
		exclude_files: ["index.html", "bucketlist.js", "fragment_id_redirect.js", "fragment_id_redirections.json", "config.js", "readme.md", "robots.txt"],
		prefix_sort_map: {
			"invest/": "semver"
		},
		// sort_option: "A2Z", // 'A2Z', 'Z2A', 'BIG2SMALL', 'SMALL2BIG'
		// root_dir: "invest/"	,
		special_bucket_objects: "fragment_id_redirections.json"
	},
}

export { listing_config }