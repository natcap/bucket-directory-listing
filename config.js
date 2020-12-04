var listing_config = {
	"releases.naturalcapitalproject.org": { // public domain of a bucket
		bucket_url: "https://www.googleapis.com/storage/v1/b/releases.naturalcapitalproject.org/o",
		public_url: "https://storage.googleapis.com/releases.naturalcapitalproject.org",
		exclude_files: ["index.html", "bucketlist.js", "config.js", "readme.md" , "robots.txt"],
		// If entries under a special prefix should be sorted in a special way
		prefix_sort_map: {
			"invest": "semver"
		},
		// sort_option: "A2Z", // 'A2Z', 'Z2A', 'BIG2SMALL', 'SMALL2BIG'
		// root_dir: "invest/",
	},
	"localhost:8000": { // another bucket domain, this one convenient for local development.
		bucket_url: "https://www.googleapis.com/storage/v1/b/releases.naturalcapitalproject.org/o",
		public_url: "https://storage.googleapis.com/releases.naturalcapitalproject.org",
		exclude_files: ["index.html", "bucketlist.js", "config.js", "readme.md", "robots.txt"],
		prefix_sort_map: {
			"invest/": "semver"
		},
		// sort_option: "A2Z", // 'A2Z', 'Z2A', 'BIG2SMALL', 'SMALL2BIG'
		// root_dir: "invest/"	,
	},
}

export { listing_config }