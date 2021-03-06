/*
Copyright (c) 2011 BitTorrent, Inc. All rights reserved.

Use of this source code is governed by a BSD-style that can be
found in the LICENSE file.
*/
(function(jQuery){

var LANG_LIST = LANG_LIST || {};
/* there are 3 main modes of operation

1) standard webui
2) standard webui but with request wrapped (window.raptor)
3) this is imported from the uT Remote interface (window.utweb !== undefined)

*/
window.guiBase = "";
window.proxyBase = "/proxy";
window.apiBase = "/api";
var isGuest = window.location.pathname.test(/.*guest.html$/);

var utWebUI = {
    "plugins": {},
	"torrents": {},
	"peerlist": [],
	"filelist": [],
	"settings": {},
	"props": {},
	"xferhist": {},
	"dirlist": [],
	"categories": {
		"cat_all": 0, // all
		"cat_dls": 0, // downloading
		"cat_com": 0, // completed
		"cat_act": 0, // active
		"cat_iac": 0, // inactive
		"cat_nlb": 0  // no-label
	},
	"labels": {},
	"torGroups": {},
	"defTorGroup": {
		"cat": {},
		"lbl": {}
	},
	"torQueueMax": -1,
	"limits": {
		"reqRetryDelayBase": 2, // seconds
		"reqRetryMaxAttempts": 5,
		"minTableRows": 5,
		"maxVirtTableRows": Math.ceil(screen.height / 16) || 100,
		"minUpdateInterval": 500,
		"minDirListCache": 30, // seconds
		"minFileListCache": 60, // seconds
		"minPeerListCache": 5, // seconds
		"minXferHistCache": 60, // seconds
		"defHSplit": 140,
		"defVSplit": 225,
		"minHSplit": 25,
		"minVSplit": 150,
		"minTrtH": 100,
		"minTrtW": 150
	},
	"defConfig": {
		"showDetails": true,
		"showDetailsIcons": true,
		"showCategories": true,
		"showToolbar": true,
		"showStatusBar": true,
		"showSpeedGraph": true,
		"useSysFont": true,
		"updateInterval": 3000,
		"maxRows": 0,
		"lang": "en",
		"hSplit": -1,
		"vSplit": -1,
		"torrentTable": {
			"colMask": 0x0000, // automatically calculated based on this.trtColDefs
			"colOrder": [], // automatically calculated based on this.trtColDefs
			"colWidth": [], // automatically calculated based on this.trtColDefs
			"reverse": false,
			"sIndex": -1
		},
		"peerTable": {
			"colMask": 0x0000, // automatically calculated based on this.prsColDefs
			"colOrder": [], // automatically calculated based on this.prsColDefs
			"colWidth": [], // automatically calculated based on this.prsColDefs
			"reverse": false,
			"sIndex": -1
		},
		"fileTable": {
			"colMask": 0x0000, // automatically calculated based on this.flsColDefs
			"colOrder": [], // automatically calculated based on this.flsColDefs
			"colWidth": [], // automatically calculated based on this.flsColDefs
			"reverse": false,
			"sIndex": -1
		},
		"advOptTable": {
			"rowMultiSelect": false
		},
		"activeSettingsPane": "",
		"activeTorGroups": {
			"cat": {"cat_all": 1},
			"lbl": {}
		}
	},
	"torrentID": "", // selected torrent
	"propID": "", // selected torrent (single)
	"spdGraph": new SpeedGraph(),
	"trtTable": new STable(),
	"prsTable": new STable(),
	"flsTable": new STable(),
	"advOptTable": new STable(),
	"trtColDefs": [
		//[ colID, colWidth, colType, colDisabled = false, colIcon = false, colAlign = ALIGN_AUTO, colText = "" ]
		  ["name", 220, TYPE_STRING]
		, ["order", 35, TYPE_NUM_ORDER]
		, ["size", 75, TYPE_NUMBER]
		, ["remaining", 90, TYPE_NUMBER, true]
		, ["done", 60, TYPE_NUM_PROGRESS]
		, ["status", 100, TYPE_CUSTOM]
		, ["seeds", 60, TYPE_NUMBER]
		, ["peers", 60, TYPE_NUMBER]
		, ["seeds_peers", 80, TYPE_NUMBER, true]
		, ["downspeed", 80, TYPE_NUMBER]
		, ["upspeed", 80, TYPE_NUMBER]
		, ["eta", 60, TYPE_NUM_ORDER]
		, ["uploaded", 75, TYPE_NUMBER, true]
		, ["downloaded", 75, TYPE_NUMBER, true]
		, ["ratio", 50, TYPE_NUMBER]
		, ["availability", 50, TYPE_NUMBER]
		, ["label", 80, TYPE_STRING, true]
		, ["added", 150, TYPE_NUMBER, true, false, ALIGN_LEFT]
		, ["completed", 150, TYPE_NUMBER, true, false, ALIGN_LEFT]
		, ["url", 250, TYPE_STRING, true]
	],
	"prsColDefs": [
		//[ colID, colWidth, colType, colDisabled = false, colIcon = false, colAlign = ALIGN_AUTO, colText = "" ]
		  ["ip", 200, TYPE_STRING] // TODO: See if this should use TYPE_CUSTOM
		, ["port", 60, TYPE_NUMBER, true]
		, ["client", 125, TYPE_STRING]
		, ["flags", 60, TYPE_STRING]
		, ["pcnt", 80, TYPE_NUM_PROGRESS]
		, ["relevance", 70, TYPE_NUMBER, true]
		, ["downspeed", 80, TYPE_NUMBER]
		, ["upspeed", 80, TYPE_NUMBER]
		, ["reqs", 40, TYPE_STRING]
		, ["waited", 60, TYPE_NUMBER, true]
		, ["uploaded", 70, TYPE_NUMBER]
		, ["downloaded", 70, TYPE_NUMBER]
		, ["hasherr", 70, TYPE_NUMBER, true]
		, ["peerdl", 70, TYPE_NUMBER]
		, ["maxup", 70, TYPE_NUMBER, true]
		, ["maxdown", 70, TYPE_NUMBER, true]
		, ["queued", 70, TYPE_NUMBER, true]
		, ["inactive", 60, TYPE_NUMBER, true]
	],
	"flsColDefs": [
		//[ colID, colWidth, colType, colDisabled = false, colIcon = false, colAlign = ALIGN_AUTO, colText = "" ]
		  ["name", 300, TYPE_STRING]
		, ["size", 75, TYPE_NUMBER]
		, ["done", 75, TYPE_NUMBER]
		, ["pcnt", 60, TYPE_NUM_PROGRESS]
		, ["firstpc", 70, TYPE_NUMBER, true]
		, ["numpcs", 70, TYPE_NUMBER, true]
		, ["prio", 65, TYPE_NUMBER, false, false, ALIGN_LEFT]
	],
	"advOptColDefs": [
		//[ colID, colWidth, colType, colDisabled = false, colIcon = false, colAlign = ALIGN_AUTO, colText = "" ]
		  ["name", 240, TYPE_STRING]
		, ["value", 235, TYPE_STRING]
	],
	"trtColDoneIdx": -1, // automatically calculated based on this.trtColDefs
	"trtColStatusIdx": -1, // automatically calculated based on this.trtColDefs
	"flsColPrioIdx": -1, // automatically calculated based on this.flsColDefs
	"updateTimeout": null,
	"totalDL": 0,
	"totalUL": 0,
	"TOKEN": "",
	"delActions": ["remove", "removetorrent", "removedata", "removedatatorrent"],

	"advSettings": {
		  "bt.allow_same_ip": ""
		, "bt.auto_dl_enable": ""
		, "bt.auto_dl_factor": ""
		, "bt.auto_dl_interval": ""
		, "bt.auto_dl_qos_min": ""
		, "bt.auto_dl_sample_average": ""
		, "bt.auto_dl_sample_window": ""
		, "bt.ban_ratio": ""
		, "bt.ban_threshold": ""
		, "bt.compact_allocation": ""
		, "bt.connect_speed": ""
		, "bt.determine_encoded_rate_for_streamables": ""
		, "bt.enable_pulse": ""
		, "bt.enable_tracker": ""
		, "bt.failover_peer_speed_threshold": ""
		, "bt.graceful_shutdown": ""
		, "bt.multiscrape": ""
		, "bt.no_connect_to_services": ""
		, "bt.no_connect_to_services_list": ""
		, "bt.prio_first_last_piece": ""
		, "bt.prioritize_partial_pieces": ""
		, "bt.pulse_interval": ""
		, "bt.pulse_weight": ""
		, "bt.ratelimit_tcp_only": ""
		, "bt.scrape_stopped": ""
		, "bt.send_have_to_seed": ""
		, "bt.set_sockbuf": ""
		, "bt.shutdown_tracker_timeout": ""
		, "bt.shutdown_upnp_timeout": ""
		, "bt.tcp_rate_control": ""
		, "bt.transp_disposition": ""
		, "bt.use_ban_ratio": ""
		, "bt.use_rangeblock": ""
		, "btapps.auto_update_btapps": ""
		, "btapps.auto_update_btinstalls": ""
		, "btapps.install_unsigned_apps": ""
		, "dht.rate": ""
		, "diskio.coalesce_write_size": ""
		, "diskio.coalesce_writes": ""
		, "diskio.flush_files": ""
		, "diskio.no_zero": ""
		, "diskio.resume_min": ""
		, "diskio.smart_hash": ""
		, "diskio.smart_sparse_hash": ""
		, "diskio.sparse_files": ""
		, "diskio.use_partfile": ""
		, "gui.auto_restart": ""
		, "gui.bypass_search_redirect": ""
		, "gui.color_progress_bars": ""
		, "gui.combine_listview_status_done": ""
		, "gui.compat_diropen": ""
		, "gui.default_del_action": ""
		, "gui.delete_to_trash": ""
		, "gui.graph_legend": ""
		, "gui.graph_overhead": ""
		, "gui.graph_tcp_rate_control": ""
		, "gui.graphic_progress": ""
		, "gui.log_date": ""
		, "gui.piecebar_progress": ""
		, "gui.report_problems": ""
		, "gui.show_av_icon": ""
		, "gui.show_dropzone": ""
		, "gui.show_rss_favicons": ""
		, "gui.tall_category_list": ""
		, "gui.toolbar_labels": ""
		, "gui.transparent_graph_legend": ""
		, "gui.update_rate": ""
		, "ipfilter.enable": ""
		, "isp.bep22": ""
		, "isp.fqdn": ""
		, "isp.peer_policy_enable": ""
		, "isp.peer_policy_url": ""
		, "isp.primary_dns": ""
		, "isp.secondary_dns": ""
		, "net.bind_ip": ""
		, "net.calc_rss_overhead": ""
		, "net.calc_tracker_overhead": ""
		, "net.disable_ipv6": ""
		, "net.disable_incoming_ipv6": ""
		, "net.discoverable": ""
		, "net.limit_excludeslocal": ""
		, "net.low_cpu": ""
		, "net.max_halfopen": ""
		, "net.outgoing_ip": ""
		, "net.outgoing_max_port": ""
		, "net.outgoing_port": ""
		, "net.upnp_tcp_only": ""
		, "net.utp_dynamic_packet_size": ""
		, "net.utp_initial_packet_size": ""
		, "net.utp_packet_size_interval": ""
		, "net.utp_receive_target_delay": ""
		, "net.utp_target_delay": ""
		, "net.wsaevents": ""
		, "peer.disconnect_inactive": ""
		, "peer.disconnect_inactive_interval": ""
		, "peer.lazy_bitfield": ""
		, "peer.resolve_country": ""
		, "queue.dont_count_slow_dl": ""
		, "queue.dont_count_slow_ul": ""
		, "queue.prio_no_seeds": ""
		, "queue.slow_dl_threshold": ""
		, "queue.slow_ul_threshold": ""
		, "queue.use_seed_peer_ratio": ""
		, "streaming.failover_rate_factor": ""
		, "streaming.failover_rate_factor": ""
		, "streaming.failover_set_percentage": ""
		, "streaming.min_buffer_piece": ""
		, "streaming.safety_factor": ""
		, "sys.enable_wine_hacks": ""
		, "webui.allow_pairing": ""
		, "webui.token_auth": ""
	},

	"init": function() {
		this.config = Object.merge({}, this.defConfig); // deep copy default config
		this.config.lang = "";
		
		// Calculate index of some columns for ease of reference elsewhere
		this.trtColDoneIdx = this.trtColDefs.map(function(item) { return (item[0] == "done"); }).indexOf(true);
		this.trtColStatusIdx = this.trtColDefs.map(function(item) { return (item[0] == "status"); }).indexOf(true);
		this.flsColPrioIdx = this.flsColDefs.map(function(item) { return (item[0] == "prio"); }).indexOf(true);

		// Set default colMask values based on colDefs
		this.trtColDefs.each(function(item, index) { this.trtColToggle(index, item[3], true); }, this);
		this.prsColDefs.each(function(item, index) { this.prsColToggle(index, item[3], true); }, this);
		this.flsColDefs.each(function(item, index) { this.flsColToggle(index, item[3], true); }, this);

		// Load settings
		this.getSettings((function() {
            this.getPlugins((function() {
                this.update.delay(0, this, (function() {
                    this.refreshSelectedTorGroups();
                    this.hideMsg();
                }).bind(this));
			}).bind(this));
		}).bind(this));
	},

	"showMsg": function(html) {
		if (typeOf(html) === 'element') {
			$("msg").clear().grab(html);
		}
		else {
			$("msg").set("html", html);
		}
		$("cover").show();
	},

	"hideMsg": function() {
		$("cover").hide();
	},

	"beginPeriodicUpdate": function(delay) {
		this.endPeriodicUpdate();

		delay = parseInt(delay, 10);
		if (isNaN(delay)) delay = this.config.updateInterval;

		this.config.updateInterval = delay = delay.max(this.limits.minUpdateInterval);
		this.updateTimeout = this.update.delay(delay, this);
	},

	"endPeriodicUpdate": function() {
		clearTimeout(this.updateTimeout);
		clearInterval(this.updateTimeout);
	},
    
    "getPlugins": function(fn)
    {
        var self = this;
        
        this.request("get", "action=getplugins", null, (function(data)
        {
            for(var i = 0; i < data.plugins.length; i++)
            {
                var plugin = data.plugins[i];
                
                if(plugin.init !== undefined)
                {
                    Asset.javascript(apiBase + "?token=" + self.TOKEN + "&action=getpluginfile&plugin=" + plugin.name + "&file=" + plugin.init);
                }
            }
            
            if(fn) fn.delay(0, self);
        }).bind(this));
    },

	"proxyFiles": function(sid, fids, streaming) {

{ // TODO: Remove this once backend support is stable (requires 3.0+)
	if (undefined === this.settings["webui.uconnect_enable"]) return;
}

		$each($$(".downloadfrm"), function(frm) {
			frm.dispose().destroy();
		}, this);

		$each(fids, function(fid) {
			new IFrame({
				"class": "downloadfrm",
				"src": proxyBase + "?sid=" + sid + "&file=" + fid + "&disposition=" + (streaming ? "INLINE" : "ATTACHMENT") + "&service=DOWNLOAD&qos=0",
				"styles": {
					  display: "none"
					, height: 0
					, width: 0
				}
			}).inject(document.body);
		}, this);
	},

	"request": function(method, qs, data, fn, async, fails) {
		if (typeOf(fails) != 'array') fails = [0]; // array so to pass by reference

		var self = this;

        var really_async = true;
        if (really_async !== undefined) {
            really_async = async;
        }

		var req = function() {
			try {
				new Request.JSON({
					"url": apiBase + "?token=" + self.TOKEN + "&" + qs + "&t=" + Date.now(),
					"method": method,
					"async": typeof(async) === 'undefined' || !!async,
                    "data": (data != null ? JSON.encode(data) : null),
                    "urlEncoded": false,
					"onFailure": function() {
						// TODO: Need to be able to distinguish between recoverable and unrecoverable errors...
						//       Recoverable errors should be retried, unrecoverable errors should not.
						//       This is not possible without backend cooperation, because as of uTorrent 2.1,
						//       the backend returns the same error code/message whether or not the error is
						//       recoverable. Examples:
						//       - Recoverable: Bad token (just get a new token)
						//       - Unrecoverable: "/gui/?action=setsetting&s=webui.cookie&v=..." failing

						self.endPeriodicUpdate();

						fails[0]++;
						var delay = Math.pow(self.limits.reqRetryDelayBase, fails[0]);
						if (fails[0] <= self.limits.reqRetryMaxAttempts) {
							log("Request failure #" + fails[0] + " (will retry in " + delay + " seconds): " + qs);
						}
						else {
							window.removeEvents("unload");
							self.showMsg(
								'<p>WebUI is having trouble connecting to Hadouken.</p>' +
								'<p>Try <a href="#" onclick="window.location.reload(true);">reloading</a> the page.</p>'
							);
							return;
						}

						self.TOKEN = "";
						self.request.delay(delay * 1000, self, [qs, function(json) {
							if (fails[0]) {
								fails[0] = 0;
									// Make sure callback gets called only once. Otherwise, WebUI may
									// hammer the backend with tons of requests after failure recovery (to
									// be exact, it may spam as many requests as there have been failures)

								log("Request retry succeeded: " + qs);
								if (fn) fn.delay(0, self, json);
								self.beginPeriodicUpdate();
							}
						}, async, fails]);
					},
					"onSuccess": (fn) ? fn.bind(self) : Function.from()
				}).send();
			} catch(e){}
		};

		if (!self.TOKEN)
			self.requestToken(req, true);
		else
			req();
	},

	"requestToken": function(fn, async) {
		var self = this;
		try {
			new Request({
				"url": apiBase + "?action=gettoken&t=" + Date.now(),
				"method": "get",
				"async": !!async,
				"onFailure": (fn) ? fn.bind(self) : Function.from(),
				"onSuccess": function(str) {
					self.TOKEN = JSON.parse(str);
					if (fn) fn.delay(0);
				}
			}).send();
		} catch(e){}
	},

	"perform": function(action) {
		var all = false;

		// Pre-process action
		switch (action) {
			case "pauseall":
				action = "pause";
				all = true;
			break;

			case "unpauseall":
				action = "unpause";
				all = true;
			break;
		}

		// Get hashes
		var hashes = this.getHashes(action, all);

		// Post-process action
		switch (action) {
			case "pause":
				if (!all && hashes.length === 0) {
					action = "unpause";
					hashes = this.getHashes(action);
				}
			break;
		}

		if (hashes.length == 0) return;

		if (action.test(/^remove/) && hashes.contains(this.torrentID)) {
			this.torrentID = "";
			this.clearDetails();
		}

        this.request("post", "action=" + action, hashes, (function() {
            this.update();
        }).bind(this));
	},

	"getHashes": function(act, all) {
		var hashes = [];
		var list = (all
			? Object.keys(this.torrents)
			: this.trtTable.selectedRows
		)
		var len = list.length;
		while (len--) {
			var key = list[len];
			var stat = this.torrents[key][CONST.TORRENT_STATUS];
			switch (act) {
				case "forcestart":
					if ((stat & 1) && !(stat & 64) && !(stat & 32)) continue;
				break;

				case "start":
					if ((stat & 1) && !(stat & 32) && (stat & 64)) continue;
				break;

				case "pause":
					if ((stat & 32) || (!(stat & 64) && !(stat & 1))) continue;
				break;

				case "unpause":
					if (!(stat & 32)) continue;
				break;

				case "stop":
					if (!(stat & 1) && !(stat & 2) && !(stat & 16) && !(stat & 64)) continue;
				break;

				case "recheck":
					if (stat & 2) continue;
				break;

				case "queueup":
				case "queuedown":
				case "queuetop":
				case "queuebottom":
					key = { qnum: this.torrents[key][CONST.TORRENT_QUEUE_POSITION], hash: key };
					if (key.qnum <= 0) continue;
				break;

				case "remove":
				case "removetorrent":
				case "removedata":
				case "removedatatorrent":
				break;

				default:
					continue;
			}

			hashes.push(key);
		}

		// Sort hash list for queue reordering, since the backend executes
		// actions sequentially in the order that the hashes are passed in the
		// GET argument list.
		var hashcount = hashes.length;
		if (hashcount > 0 && act.test(/^queue/)) {
			var queueLimMin = 1,
				queueLimMax = this.torQueueMax;

			// Filter setup
			var sortdir;
			switch (act) {
				case "queuedown":
				case "queuetop":
					sortdir = -1;
				break;

				case "queueup":
				case "queuebottom":
					sortdir = 1;
				break;
			}

			var limsetter, qfilter;
			switch (act) {
				case "queuedown":
					limsetter = function(item) {
						if (item.qnum == queueLimMax)
							--queueLimMax;
					};
					qfilter = function(item) {
						return (item.qnum <= queueLimMax);
					};
				break;

				case "queueup":
					limsetter = function(item) {
						if (item.qnum == queueLimMin)
							++queueLimMin;
					};
					qfilter = function(item) {
						return (queueLimMin <= item.qnum);
					};
				break;

				case "queuebottom":
					var qmin = Number.MAX_VALUE;
					limsetter = function(_, i, list) {
						var qnum = list[hashcount-i-1].qnum;
						if (qnum == queueLimMax)
							--queueLimMax;
						if (qnum < qmin)
							qmin = qnum;
					};
					qfilter = function(item) {
						return (qmin < queueLimMax);
					};
				break;

				case "queuetop":
					var qmax = -Number.MAX_VALUE;
					limsetter = function(_, i, list) {
						var qnum = list[hashcount-i-1].qnum;
						if (qnum == queueLimMin)
							++queueLimMin;
						if (qmax < qnum)
							qmax = qnum;
					};
					qfilter = function(item) {
						return (queueLimMin < qmax);
					};
				break;

				default:
					limsetter = Function.from();
					qfilter = Function.from(true);
			}

			// Process hash list
			hashes = hashes.sort(function(x, y) {
				return sortdir * (x.qnum < y.qnum ? -1 : (x.qnum > y.qnum ? 1 : 0));
			}).each(limsetter).filter(qfilter).map(function(item) {
				return item.hash;
			});
		}

		return hashes;
	},

	"forcestart": function() {
		this.perform("forcestart");
	},

	"start": function() {
		this.perform("start");
	},

	"pause": function() {
		this.perform("pause");
	},

	"stop": function() {
		this.perform("stop");
	},

	"queueup": function(top) {
		this.perform(!!top ? "queuetop" : "queueup");
	},

	"queuedown": function(bot) {
		this.perform(!!bot ? "queuebottom" : "queuedown");
	},

	"removeDefault": function(shift) {
		this.remove((this.settings["gui.default_del_action"] || 0) | (shift ? 2 : 0));
	},

	"remove": function(mode) {
		if (DialogManager.modalIsVisible()) return;

		var count = this.trtTable.selectedRows.length;
		if (count == 0) return;

		mode = parseInt(mode, 10);
		if (isNaN(mode) || mode < 0 || this.delActions.length <= mode)
			mode = this.settings["gui.default_del_action"] || 0;

{ // TODO: Remove this once backend support is stable (requires 3.0+)
	if (undefined === this.settings["webui.uconnect_enable"]) mode &= ~1; // force non-.torrent removal mode
}

		var act = this.perform.bind(this, this.delActions[mode]);

		if ([this.settings["confirm_when_deleting"], true].pick()) {
			var ask;
			switch (mode) {
				case CONST.TOR_REMOVE:
				case CONST.TOR_REMOVE_TORRENT:
					ask = ((count == 1) ? "OV_CONFIRM_DELETE_ONE" : "OV_CONFIRM_DELETE_MULTIPLE");
				break;

				case CONST.TOR_REMOVE_DATA:
				case CONST.TOR_REMOVE_DATATORRENT:
					ask = ((count == 1) ? "OV_CONFIRM_DELETEDATA_ONE" : "OV_CONFIRM_DELETEDATA_MULTIPLE");
				break;
			}

			DialogManager.popup({
				  title: "Remove Torrent(s)" // TODO: Localize
				, icon: "dlgIcon-Delete"
				, message: L_(ask).replace(/%d/, count)
				, buttons: [
					{ text: L_("DLG_BTN_YES"), focus: true, click: act },
					{ text: L_("DLG_BTN_NO") }
				]
			});
		}
		else {
			act();
		}
	},

	"recheck": function() {
		this.perform("recheck");
	},

	"pauseAll": function() {
		this.perform("pauseall");
	},

	"unpauseAll": function() {
		this.perform("unpauseall");
	},

	"getList": function(qs, fn) {
		this.endPeriodicUpdate();
		qs = qs || "";
		if (qs != "")
			qs += "&";
		this.request("get", "action=gettorrents", null, (function(json) {
			this.loadList(json);
			if (fn) fn(json);
		}).bind(this));
	},

	"getStatusInfo": function(state, progress, complete) {
		var res = ["", ""];
        
        console.log(state + ", " + progress + ", " + complete);
        
        if(state == CONST.STATE_STOPPED && complete)
        {
            res = ["Status_Completed", L_("OV_FL_FINISHED")];
        }
        else if((state == CONST.STATE_STOPPED || state == CONST.STATE_STOPPING) && !complete)
        {
            res = ["Status_Incomplete", L_("OV_FL_STOPPED")];
        }
        else if(state == CONST.STATE_PAUSED)
        {
            res = ["Status_Paused", L_("OV_FL_PAUSED")];
        }
        else if(state == CONST.STATE_DOWNLOADING)
        {
            res = complete ? ["Status_Up", L_("OV_FL_SEEDING")] : ["Status_Down", L_("OV_FL_DOWNLOADING")];
        }
        else if(state == CONST.STATE_SEEDING)
        {
            res = ["Status_Up", L_("OV_FL_SEEDING")];
        }
        else if(state == CONST.STATE_HASHING)
        {
            res = ["Status_Checking", L_("OV_FL_CHECKED").replace(/%:\.1d%/, (progress / 10).toFixedNR(1))];
        }
        else if(state == CONST.STATE_ERROR)
        {
            res = ["Status_Error", L_("OV_FL_ERROR").replace(/%s/, "??")];
        }
        
        return res;
	},

	"loadList": function(json) {
		function extractLists(fullListName, changedListName, removedListName, key, exList) {
			var extracted = {hasChanged: false};

			if (!has(json, fullListName)) {
				if (!has(json, changedListName)) {
					extracted[fullListName] = extracted[removedListName] = [];
					extracted.hasChanged = false;
				}
				else {
					extracted[fullListName] = json[changedListName];
					delete json[changedListName];

					extracted[removedListName] = json[removedListName];
					delete json[removedListName];

					extracted.hasChanged = ((extracted[fullListName].length + extracted[removedListName].length) > 0);
				}
			}
			else {
				extracted.hasChanged = true;

				var list = extracted[fullListName] = json[fullListName];
				delete json[fullListName];

				// What:
				//   Remove items that no longer exist, for the situation in which
				//   the backend sends the full items list ('torrents', for example)
				//   even though a cid was sent with the list=1 request.
				// When:
				//   This happens when the sent cid is not valid, which happens when
				//   multiple sessions of WebUI are sending interleaved list=1&cid=...
				//   requests.
				// Why:
				//   When this happens, WebUI no longer has a proper removed items
				//   list ('torrentm', for example) by which it can actually remove
				//   those items that have been removed from the backend.
				// How:
				//   This fixes it by comparing the received full items list with the
				//   list of existing items to see which keys no longer exist, and
				//   manually generating a removed items list from that.
				// Note:
				//   The alternative, instead of comparing, would be to clear the
				//   list completely and replace it with this list instead, but that
				//   is likely to be less efficient when taking into account the fact
				//   that more DOM manipulations would have to be used to repopulate
				//   any UI elements dependent on the list. Additionally, it isn't
				//   as general an approach, as it requires specific knowledge about
				//   the UI element in question to be included in this logic.

				var removed = extracted[removedListName] = [];

				var exKeys = {};
				for (var k in exList) {
					exKeys[k] = 1;
				}
				for (var i = 0, len = list.length; i < len; i++) {
					if (has(exKeys, list[i][key]))
						delete exKeys[list[i][key]];
				}
				for (var k in exKeys) {
					removed.push(k);
				}
			}

			return extracted;
		}

		// Extract Labels
	        if (! json.label) { this.loadLabels(Array.clone([])); }
	        else { this.loadLabels(Array.clone(json.label)); }

		// Extract Torrents
		(function(deltaLists) {
			var sortedColChanged = false;

			this.trtTable.keepScroll((function() {
				// Handle added/changed items
				deltaLists.torrents.each(function(item) {
					this.totalDL += item[CONST.TORRENT_DOWNSPEED];
					this.totalUL += item[CONST.TORRENT_UPSPEED];

					var hash = item[CONST.TORRENT_HASH];
                    var statinfo = this.getStatusInfo(item[CONST.TORRENT_STATUS], item[CONST.TORRENT_PROGRESS], item[CONST.TORRENT_COMPLETE]);

					this.torGroups[hash] = this.getTorGroups(item);

					var row = this.trtDataToRow(item);
					var ret = false, activeChanged = false;

					if (has(this.torrents, hash)) {
						// Old torrent found... update list
						var rdata = this.trtTable.rowData[hash];
						activeChanged = (rdata.hidden == this.torrentIsVisible(hash));
						if (activeChanged) rdata.hidden = !rdata.hidden;

						this.trtTable.setIcon(hash, statinfo[0]);

						row.each(function(v, k) {
							if (v != rdata.data[k]) {
								ret = this.trtTable.updateCell(hash, k, row) || ret;

								if ("done" == this.trtColDefs[k][0]) {
									// Update the "Status" column if "Done" column changed (in case "Checking" percentage needs updating)
									ret = this.trtTable.updateCell(hash, this.trtColStatusIdx, row) || ret;
								}
							}
						}, this);

						if (!ret && activeChanged) {
							this.trtTable._insertRow(hash);
						}
					}
					else {
						// New torrent found... add to list
						this.trtTable.addRow(row, hash, statinfo[0], !this.torrentIsVisible(hash));
						ret = true;
					}

					this.torrents[hash] = item;
					sortedColChanged = sortedColChanged || ret;
				}, this);

				this.trtTable.requiresRefresh = sortedColChanged || this.trtTable.requiresRefresh;

				// Handle removed items
				var clear = false;

				if (window.utweb === undefined) { // torGroups does not get setup properly in remote
					deltaLists.torrentm.each(function(key) {
						Object.each(this.torGroups[key].cat, function(_, cat) {
							--this.categories[cat];
						}, this);

						delete this.torGroups[key];
						delete this.torrents[key];
						this.trtTable.removeRow(key);

						if (this.torrentID == key) {
							clear = true;
						}
					}, this);
				}
				if (clear) {
					this.torrentID = "";
					this.clearDetails();
				}

				// Calculate maximum torrent job queue number
				var queueMax = -1, q = CONST.TORRENT_QUEUE_POSITION;
				Object.each(this.torrents, function(trtData) {
					if (queueMax < trtData[q]) {
						queueMax = trtData[q];
					}
				});
				this.torQueueMax = queueMax;
			}).bind(this));

			// Finish up
			this.trtTable.resizePads();

			this.updateLabels();
			this.trtTable.refresh();
		}).bind(this)(extractLists("torrents", "torrentp", "torrentm", CONST.TORRENT_HASH, this.torrents));

		// Finish up
		json = null;
		this.beginPeriodicUpdate();
	},

	"update": function(listcb) {
		if (window.utweb !== undefined) { return; }
		this.totalDL = 0;
		this.totalUL = 0;

		this.getList(null, (function() {
			this.spdGraph.addData(this.totalUL, this.totalDL);

			this.showDetails();

			this.updateTitle();
			this.updateToolbar();
			this.updateStatusBar();

			if (typeof(listcb) === 'function') listcb();
		}).bind(this));

		if (typeof(DialogManager) !== 'undefined') {
			if (DialogManager.showing.contains("Settings") && ("dlgSettings-TransferCap" == this.stpanes.active)) {
				this.getTransferHistory();
			}
		}
	},

	"loadLabels": function(labels) {
		var labelList = $("mainCatList-labels"), temp = {};
		labels.each(function(lbl, idx) {
			var label = lbl[0], labelId = "lbl_" + encodeID(label), count = lbl[1], li = null;
			if ((li = $(labelId))) {
				li.getElement(".count").set("text", count);
			}
			else {
				labelList.grab(new Element("li", {"id": labelId})
					.appendText(label + " (")
					.grab(new Element("span", {"class": "count", "text": count}))
					.appendText(")")
				);
			}
			if (has(this.labels, label))
				delete this.labels[label];
			temp[label] = count;
		}, this);

		var activeChanged = false;
		for (var k in this.labels) {
			var id = "lbl_" + encodeID(k);
			if (this.config.activeTorGroups.lbl[id]) {
				activeChanged = true;
			}
			delete this.config.activeTorGroups.lbl[id];
			$(id).destroy();
		}
		this.labels = temp;

		if (activeChanged) {
			var activeGroupCount = (
				  Object.getLength(this.config.activeTorGroups.cat)
				+ Object.getLength(this.config.activeTorGroups.lbl)
			);

			if (activeGroupCount <= 0) {
				this.config.activeTorGroups.cat["cat_all"] = 1;
			}
			this.refreshSelectedTorGroups();
		}
	},

	"torrentIsVisible": function(hash) {
		var group = this.torGroups[hash];
		var actCat = this.config.activeTorGroups.cat;
		var actLbl = this.config.activeTorGroups.lbl;

		var visible = true;

		// Category: Downloading/Completed
		if (visible && (actCat["cat_dls"] || actCat["cat_com"])) {
			visible = visible && (
				(actCat["cat_dls"] && group.cat["cat_dls"]) ||
				(actCat["cat_com"] && group.cat["cat_com"])
			);
		}

		// Category: Active/Inactive
		if (visible && (actCat["cat_act"] || actCat["cat_iac"])) {
			visible = visible && (
				(actCat["cat_act"] && group.cat["cat_act"]) ||
				(actCat["cat_iac"] && group.cat["cat_iac"])
			);
		}

		// Labels
		if (visible && (actCat["cat_nlb"] || Object.some(actLbl, Function.from(true)))) {
			visible = visible && (
				(actCat["cat_nlb"] && group.cat["cat_nlb"]) ||
				Object.some(actLbl, function(_, lbl) { return group.lbl[lbl]; })
			);
		}

		return !!visible;
	},

	"getTorGroups": function(tor) {
		var groups = Object.merge({}, this.defTorGroup);

		// All
		groups.cat["cat_all"] = 1;

		// Labels
		var lbls = Array.from(tor[CONST.TORRENT_LABEL] || []);
		if (lbls.length <= 0) {
			groups.cat["cat_nlb"] = 1;
		}
		else {
			lbls.each(function(lbl) {
				groups.lbl["lbl_" + encodeID(lbl)] = 1;
			});
		}

		// Categories: Downloading/Completed
		if (tor[CONST.TORRENT_PROGRESS] < 1000) {
			groups.cat["cat_dls"] = 1;
		}
		else {
			groups.cat["cat_com"] = 1;
		}

		// Categories: Active/Inactive
		if (
			(tor[CONST.TORRENT_DOWNSPEED] > (this.settings["queue.slow_dl_threshold"] || 103)) ||
			(tor[CONST.TORRENT_UPSPEED] > (this.settings["queue.slow_ul_threshold"] || 103))
		) {
			groups.cat["cat_act"] = 1;
		}
		else {
			groups.cat["cat_iac"] = 1;
		}

		// Update group counts
		// TODO: Move this elsewhere!
		(function(groups, oldGroups) {
			if (!oldGroups) {
				Object.each(groups.cat, function(_, cat) {
					++this.categories[cat];
				}, this);
			}
			else {
				// Labels
				if (groups.cat["cat_nlb"]) {
					if (!oldGroups.cat["cat_nlb"]) {
						++this.categories["cat_nlb"];
					}
				}
				else {
					if (oldGroups.cat["cat_nlb"]) {
						--this.categories["cat_nlb"];
					}
				}

				// Categories: Downloading/Completed
				if (groups.cat["cat_dls"]) {
					if (oldGroups.cat["cat_com"]) {
						--this.categories["cat_com"];
						++this.categories["cat_dls"];
					}
				}
				else {
					if (oldGroups.cat["cat_dls"]) {
						--this.categories["cat_dls"];
						++this.categories["cat_com"];
					}
				}

				// Categories: Active/Inactive
				if (groups.cat["cat_act"]) {
					if (oldGroups.cat["cat_iac"]) {
						--this.categories["cat_iac"];
						++this.categories["cat_act"];
					}
				}
				else {
					if (oldGroups.cat["cat_act"]) {
						--this.categories["cat_act"];
						++this.categories["cat_iac"];
					}
				}
			}
		}).bind(this)(groups, this.torGroups[tor[CONST.TORRENT_HASH]]);

		return groups;
	},

	"setLabel": function(lbl) {
		var hashes = [];
		for (var i = 0, j = this.trtTable.selectedRows.length; i < j; i++) {
			var key = this.trtTable.selectedRows[i];
			if (this.torrents[key][CONST.TORRENT_LABEL] != lbl)
				hashes.push(key);
		}
		if (hashes.length > 0) {
			//var sep = "&v=" + encodeURIComponent(lbl) + "&s=label&hash=";
            
            var data = {};
            
            for(var i = 0; i < hashes.length; i++)
            {
                data[hashes[i]] = {};
                data[hashes[i]].label = lbl;
            }
            
            this.request("post", "action=setprops", data);
			//this.request("post", "action=setprops&s=label&hash=" + hashes.join(sep) + "&v=" + encodeURIComponent(lbl));
		}
	},

	"newLabel": function() {
		var tmpl = "";
		if (this.trtTable.selectedRows.length == 1)
			tmpl = this.torrents[this.trtTable.selectedRows[0]][CONST.TORRENT_LABEL];

		DialogManager.popup({
			  title: L_("OV_NEWLABEL_CAPTION")
			, icon: "dlgIcon-Label"
			, message: L_("OV_NEWLABEL_TEXT")
			, input: tmpl || ""
			, buttons: [
				{ text: L_("DLG_BTN_OK"), submit: true, click: this.createLabel.bind(this) },
				{ text: L_("DLG_BTN_CANCEL") }
			]
		});
	},

	"createLabel": function(lbl) {
		this.setLabel(lbl);
	},

	"updateLabels": function() {
		["cat_all", "cat_dls", "cat_com", "cat_act", "cat_iac", "cat_nlb"].each(function(cat) {
			$(cat + "_c").set("text", this.categories[cat]);
		}, this);
	},

	"catListClick": function(ev, listId) {
		// Get selected element
		var element = ev.target;
		while (element && element.id !== listId && element.tagName !== "LI") {
			element = element.getParent();
		}
		if (!element || !element.id || element.tagName !== "LI") return;

		var eleId = element.id;
		if (eleId === "cat_nlb") {
			listId = "mainCatList-categories";
		}

		// Prepare for changes
		var activeGroupCount = (
			  Object.getLength(this.config.activeTorGroups.cat)
			+ Object.getLength(this.config.activeTorGroups.lbl)
		);

		var prevSelected = activeGroupCount > 1 && Object.some(this.config.activeTorGroups, function(type) {
			return (eleId in type);
		});

		if ((Browser.Platform.mac && ev.meta) || (!Browser.Platform.mac && ev.control)) {
			if (ev.isRightClick()) {
				prevSelected = false;
			}
		}
		else {
			if (!(ev.isRightClick() && prevSelected)) {
				this.config.activeTorGroups = {};
				Object.each(this.defConfig.activeTorGroups, function(_, type) {
					this.config.activeTorGroups[type] = {};
				}, this);
			}

			prevSelected = false;
		}

		// Apply changes
		var trtTableUpdate = (function() {
			this.refreshSelectedTorGroups();

			if (!isGuest && ev.isRightClick()) {
				this.trtTable.fillSelection();
				this.trtTable.fireEvent("onSelect", ev);
			}
		}).bind(this);

		switch (listId) {
			case "mainCatList-categories":
				if (prevSelected) {
					delete this.config.activeTorGroups.cat[eleId];
				}
				else {
					this.config.activeTorGroups.cat[eleId] = 1;
				}

				trtTableUpdate();
			break;

			case "mainCatList-labels":
				if (prevSelected) {
					delete this.config.activeTorGroups.lbl[eleId];
				}
				else {
					this.config.activeTorGroups.lbl[eleId] = 1;
				}

				trtTableUpdate();
			break;

			// NOTE: Yep, this code structure isn't used for anything particularly
			//       interesting. It was originally supposed to house the logic
			//       for handling RSS feeds in the category list too, but after
			//       much deliberation (seriously), I found that I simply couldn't
			//       bring myself to implement RSS as uTorrent does, because the
			//       current design that has been implemented since uTorrent 1.8
			//       just doesn't make any sense to me. RSS does not interact in
			//       any meaningful way with the rest of the UI elements in the
			//       main overview, so there is no reason it belongs there. The
			//       only real advantage I see to putting it there is that screen
			//       real estate for RSS increases, but that just isn't worth
			//       sacrificing proper and logical design for.
			//
			//       For this reason, I'm implementing RSS in WebUI as uTorrent
			//       used to do it prior to 1.8: in its own dedicated dialog. It
			//       made so much more sense to me then, and continues to make
			//       more sense to me now. I'm leaving the code structured in
			//       this way because it's more flexible -- which may be useful
			//       should (for whatever reason) this decision be reversed.
			//
			//       - Ultima

		}
	},

	"refreshSelectedTorGroups": function() {
		// Prevent needless refresh
		var deltaGroups;

		var oldGroups = this.__refreshSelectedTorGroups_activeTorGroups__;
		if (oldGroups) {
			var curGroups = this.config.activeTorGroups;
			var changeCount = 0;

			deltaGroups = {};

			// Copy group types
			for (var type in oldGroups) { deltaGroups[type] = {}; }
			for (var type in curGroups) { deltaGroups[type] = {}; }

			// Removed groups
			for (var type in oldGroups) {
				for (var group in oldGroups[type]) {
					if (!(group in curGroups[type])) {
						deltaGroups[type][group] = -1
						++changeCount;
					}
				}
			}

			// Added groups
			for (var type in curGroups) {
				for (var group in curGroups[type]) {
					if (!(group in oldGroups[type])) {
						deltaGroups[type][group] = 1;
						++changeCount;
					}
				}
			}

			if (!changeCount) return;
		}

		this.__refreshSelectedTorGroups_activeTorGroups__ = Object.merge({}, this.config.activeTorGroups);
		if (!oldGroups) {
			deltaGroups = this.config.activeTorGroups;
		}

		// Update groups list
		var val, ele;
		for (var type in deltaGroups) {
			for (var group in deltaGroups[type]) {
				ele = $(group);
				if (!ele) continue;

				val = deltaGroups[type][group];
				if (val > 0) {
					ele.addClass("sel");
				}
				else if (val < 0) {
					ele.removeClass("sel");
				}
			}
		}

		// Update detailed info pane
		if (this.torrentID != "") {
			this.torrentID = "";
			this.clearDetails();
		}

		// Update torrent jobs list
		var activeChanged = false;
		for (var hash in this.torrents) {
			var changed = (!!this.trtTable.rowData[hash].hidden === !!this.torrentIsVisible(hash));
			if (changed) {
				activeChanged = true;

				if (this.trtTable.rowData[hash].hidden) {
					this.trtTable.unhideRow(hash);
				}
				else {
					this.trtTable.hideRow(hash);
				}
			}
		}

		this.trtTable.clearSelection(activeChanged);
		this.trtTable.curPage = 0;

		if (activeChanged) {
			this.trtTable.requiresRefresh = true;

			this.trtTable.calcSize();
			this.trtTable.restoreScroll();
			this.trtTable.resizePads();
		}
	},

	"getDirectoryList": function(forceload, callback) {
		var now = Date.now();
		if (forceload || !this.dirlist._TIME_ || (now - this.dirlist._TIME_) > (this.limits.minDirListCache * 1000)) {
			this.request("get", "action=listdirs", null, (function(json) {
				this.dirlist.empty();

				this.dirlist = json["download-dirs"];
				this.dirlist._TIME_ = now;

				this.loadDirectoryList();
				if (callback) { callback(); }
			}).bind(this));
		}
		else {
			this.loadDirectoryList();
			if (callback) { callback(); }
		}
	},

	"loadDirectoryList": function() {
		var list = this.dirlist;

		// Throw data into frontend
		list[0].path = "Default download directory";
		var items = list.map(function(dir) {
			return '[' + parseInt(dir.available, 10).toFileSize(2, 2) + ' free] '+ dir.path;
		});

		var eleList = $("dlgAdd-basePath");
		var eleListDiv = $("dlgAdd-basePathDiv");
		var eleURLList = $("dlgAddURL-basePath");
		var eleURLListDiv = $("dlgAddURL-basePathDiv");
		var dispStyle;
		if (items.length > 0) {
			if (eleList)
				_loadComboboxStrings("dlgAdd-basePath", items, eleList.value);
			if (eleURLList)
				_loadComboboxStrings("dlgAddURL-basePath", items, eleURLList.value);
			dispStyle = "block";
		} else {
			dispStyle = "none";
		}
		if (eleList)
			eleList.setStyle("display", dispStyle);
		if (eleListDiv)
			eleListDiv.setStyle("display", dispStyle);
		if (eleURLList)
			eleURLList.setStyle("display", dispStyle);
		if (eleURLListDiv)
			eleURLListDiv.setStyle("display", dispStyle);
	},

	"getTransferHistory": function(forceload) {
		var now = Date.now();
		if (forceload || !this.xferhist._TIME_ || (now - this.xferhist._TIME_) > (this.limits.minXferHistCache * 1000)) {
			this.request("get", "action=getxferhist", null, (function(json) {
				this.xferhist = json.transfer_history;
				this.xferhist._TIME_ = now;

				this.loadTransferHistory();
			}).bind(this));
		}
		else {
			this.loadTransferHistory();
		}
	},

	"loadTransferHistory": function() {
		var history = this.xferhist;

		// Obtain number of days to consider
		var periodList = L_("ST_CBO_TCAP_PERIODS").split("||");
		var periodIdx = ($("multi_day_transfer_limit_span").get("value").toInt() || 0).max(0).min(periodList.length-2);
		var period = periodList[periodIdx].toInt();

		// Calculate uploads/downloads applicable to transfer cap
		var nolocal = this.getAdvSetting("net.limit_excludeslocal");

		var tu = 0, td = 0;
		for (var day = 0; day < period; day++) {
			tu += history["daily_upload"][day];
			td += history["daily_download"][day];
			if (nolocal) {
				tu -= history["daily_local_upload"][day];
				tu -= history["daily_local_download"][day];
			}
		}

		// Reduce precision for readability
		$("total_uploaded_history").set("text", tu.toFileSize());
		$("total_downloaded_history").set("text", td.toFileSize());
		$("total_updown_history").set("text", (tu + td).toFileSize());
		$("history_period").set("text", L_("DLG_SETTINGS_7_TRANSFERCAP_11").replace(/%d/, period));
	},

	"resetTransferHistory": function() {

{ // TODO: Remove this once backend support is stable (requires 3.0+)
	if (undefined === this.settings["webui.uconnect_enable"]) return;
}
		this.request("post", "action=resetxferhist", null, function () { window.location.reload(true); } );
	},

	"getSettings": function(fn) {
		var act = (function(json) {
			this.addSettings(json, fn);
		}).bind(this);

		if (isGuest) {
			act();
		}
		else {
			this.request("get", "action=getsettings", null, act);
		}
	},

	"addSettings": function(json, fn) {
		var loadCookie = (function(newcookie) {
			function safeCopy(objOrig, objNew) {
				$each(objOrig, function(v, k) {
					var tOrig = typeOf(objOrig[k]),
						tNew = typeOf(objNew[k]);

					if (tOrig === tNew) {
						if (tOrig === 'object') {
							safeCopy(objOrig[k], objNew[k]);
						}
						else {
							objOrig[k] = objNew[k];
						}
					}
				});
			}

			var cookie = this.config;

			// Pull out only data from received cookie that we already know about.
			// Next best thing short of sanity checking every single value.
			newcookie = newcookie || {};
			safeCopy(cookie, newcookie);

			// Special case some settings objects whose keys may be dynamically
			// modified during runtime.
			cookie.activeRssFeeds = newcookie.activeRssFeeds || this.defConfig.activeRssFeeds || {};
			cookie.activeTorGroups = newcookie.activeTorGroups || this.defConfig.activeTorGroups || {};

			// Set up pane selections
			if (cookie.activeSettingsPane) {
				this.stpanes.show(cookie.activeSettingsPane.replace(/^tab_/, ''));
			}

			// Set up listivews
			if (window.utweb === undefined) {
				this.trtTable.setConfig({
					  "colSort": [cookie.torrentTable.sIndex, cookie.torrentTable.reverse]
					, "colMask": cookie.torrentTable.colMask
					, "colOrder": cookie.torrentTable.colOrder
					, "colWidth": this.config.torrentTable.colWidth
				});

				this.prsTable.setConfig({
					  "colSort": [cookie.peerTable.sIndex, cookie.peerTable.reverse]
					, "colMask": cookie.peerTable.colMask
					, "colOrder": cookie.peerTable.colOrder
					, "colWidth": cookie.peerTable.colWidth
				});

				this.flsTable.setConfig({
					  "colSort": [cookie.fileTable.sIndex, cookie.fileTable.reverse]
					, "colMask": cookie.fileTable.colMask
					, "colOrder": cookie.fileTable.colOrder
					, "colWidth": cookie.fileTable.colWidth
				});

				this.tableSetMaxRows(cookie.maxRows);
			}
			

			resizeUI();
		}).bind(this);

		if (isGuest) {
			loadCookie();
		}
		else {
			var tcmode = 0;
			for (var i = 0, j = json.settings.length; i < j; i++) {
				var key = json.settings[i][CONST.SETTING_NAME],
					typ = json.settings[i][CONST.SETTING_TYPE],
					val = json.settings[i][CONST.SETTING_VALUE],
					par = json.settings[i][CONST.SETTING_PARAMS] || {};

				// handle cookie
				if (key === "webui.cookie") {
					loadCookie(JSON.decode(val, true));
					continue;
				}

				// convert types
				switch (typ) {
					case CONST.SETTINGTYPE_INTEGER: val = val.toInt(); break;
					//case CONST.SETTINGTYPE_BOOLEAN: val = ('true' === val); break;
				}
                
				// handle special settings

				switch (key) {
					case "multi_day_transfer_mode_ul": if (val) tcmode = 0; break;
					case "multi_day_transfer_mode_dl": if (val) tcmode = 1; break;
					case "multi_day_transfer_mode_uldl": if (val) tcmode = 2; break;

					case "gui.alternate_color": if (window.utweb === undefined) { this.tableUseAltColor(val); } break;
					case "gui.graph_legend": if (window.utweb === undefined) { this.spdGraph.showLegend(val); } break;
					case "gui.graphic_progress": if (window.utweb === undefined) { this.tableUseProgressBar(val); } break;
					case "gui.log_date": if (window.utweb === undefined) { Logger.setLogDate(val); } break;

					case "bt.transp_disposition": $("enable_bw_management").checked = !!(val & CONST.TRANSDISP_UTP); break;
				}

				// handle special parameters

				// TODO: See if we need anything more in implementing support for par.access
				if (CONST.SETTINGPARAM_ACCESS_RO === par.access) {
					var ele = $(key);
					if (ele) ele.addClass("disabled");
				}

				// insert into settings map and show
				this.settings[key] = val;
				_unhideSetting(key);
			}

			// Insert custom keys...
			this.settings["multi_day_transfer_mode"] = tcmode;

			{ // TODO: Remove this once backend support is stable (requires 3.0+)
				this.settings["sched_table"] = [this.settings["sched_table"], "033000330020000000000000300303003222000000000000000303003020000000000000033003003111010010100101000303003101011010100111300303003101010110100001033020330111010010110111"].pick();
				this.settings["search_list_sel"] = [this.settings["search_list_sel"], 0].pick();
				this.settings["search_list"] = [this.settings["search_list"], "BitTorrent|http://www.bittorrent.com/search?client=%v&search=\r\nGoogle|http://google.com/search?q=filetype%3Atorrent+\r\nMininova|http://www.mininova.org/search/?cat=0&search=\r\nVuze|http://search.vuze.com/xsearch/?q="].pick();
			}

			// Cleanup
			delete json.settings;
		}

		if (!(this.config.lang in LANG_LIST)) {
			var langList = "";
			for (var lang in LANG_LIST) {
				langList += "|" + lang;
			}

			var useLang = (navigator.language ? navigator.language : navigator.userLanguage || "").replace("-", "");
			if ((useLang = useLang.match(new RegExp(langList.substr(1), "i"))))
				useLang = useLang[0];

			if (useLang && (useLang in LANG_LIST))
				this.config.lang = useLang;
			else
				this.config.lang = (this.defConfig.lang || "en");
		}
		if (window.utweb)
			return;
		
		loadLangStrings({
			"lang": this.config.lang,
			"onload": (function() {
				if (!isGuest) this.loadSettings();
				if (fn) fn();
			}).bind(this)
		});
	},

	"getAdvSetting": function(name) {
		if (name in this.advOptTable.rowData) {
			// TODO: Will need to rewrite bits of stable.js so that
			//       there is a clean API for obtaining values...

			return this.advOptTable.rowData[name].data[1]; // TODO: Remove hard-coded index...
		}
	},

	"setAdvSetting": function(name, val) {
		if (undefined != val && (name in this.advOptTable.rowData)) {
			// TODO: Will need to rewrite bits of stable.js so that
			//       there is a clean API for setting values...

			this.advOptTable.rowData[name].data[1] = val;
			this.advOptTable.updateCell(name, 1); // TODO: Remove hard-coded index...
		}
	},

	"loadSettings": function() {
		this.props.multi = {
			"trackers": 0,
			"ulrate": 0,
			"dlrate": 0,
			"superseed": 0,
			"dht": 0,
			"pex": 0,
			"seed_override": 0,
			"seed_ratio": 0,
			"seed_time": 0,
			"ulslots": 0
		};
		// Advanced settings
		this.advOptTable.clearSelection();
		this.advOptSelect();

		$each(this.advSettings, function(val, key) {
			if (undefined != this.settings[key]) {
				if (undefined != this.getAdvSetting(key)) {
					this.setAdvSetting(key, this.settings[key]);
				}
				else {
					this.advOptTable.addRow([key, this.settings[key]], key);
				}
			}
		}, this);

		// Other settings
		for (var k in this.settings) {
			var ele = $(k);
			if (!ele) continue;

			var v = this.settings[k];
			if (ele.type == "checkbox") {
				ele.checked = !!v;
			}
			else {
				switch (k) {
					case "seed_ratio": v /= 10; break;
					case "seed_time": v /= 60; break;
				}
				ele.set("value", v);
			}

			ele.fireEvent("change");
			if (Browser.ie) ele.fireEvent("click");
		}

		// Parse remote access status code into human readable
		// this.showRemoteStatus(this.settings['webui.uconnect_cred_status']);

		// WebUI configuration
		[
			"useSysFont",
			"showDetails",
			"showCategories",
			"showToolbar",
			"showStatusBar",
			"updateInterval",
			"lang"
		].each(function(key) {
			var ele;
			if (!(ele = $("webui." + key))) return;
			var v = this.config[key];
			if (ele.type == "checkbox") {
				ele.checked = ((v == 1) || (v == true));
			} else {
				ele.set("value", v);
			}
		}, this);

		if (this.config.maxRows < this.limits.minTableRows) {
			value = (this.config.maxRows <= 0 ? 0 : this.limits.minTableRows);
		}
		var elemaxrows = $("webui.maxRows");
		if (elemaxrows)
			elemaxrows.set("value", this.config.maxRows);

		this.toggleSystemFont(this.config.useSysFont);

		if (!this.config.showToolbar && !isGuest)
			$("mainToolbar").hide();
		if (!this.config.showCategories)
			$("mainCatList").hide();
		if (!this.config.showDetails)
			$("mainInfoPane").hide();
		if (!this.config.showDetailsIcons)
			$("mainInfoPane-tabs").removeClass("icon");
		if (!this.config.showStatusBar)
			$("mainStatusBar").hide();

		this.toggleSearchBar();
	},

    "setSettings": function() {
        var value = null, reload = false, hasChanged = false;

		Logger.setLogDate(this.getAdvSetting("gui.log_date"));

		if (window.utweb === undefined) {
			// these settings don't apply in the ut remote version
			value = ($("webui.updateInterval").get("value").toInt() || 0);
			if (value < this.limits.minUpdateInterval) {
				value = this.limits.minUpdateInterval;
				$("webui.updateInterval").set("value", value);
			}
			if (this.config.updateInterval != value) {
				this.beginPeriodicUpdate(value);
				hasChanged = true;
			}

			value = $("webui.showToolbar").checked;
			if (this.config.showToolbar != value) {
				this.toggleToolbar(value);
				hasChanged = true;
			}

			value = $("webui.showCategories").checked;
			if (this.config.showCategories != value) {
				this.toggleCatPanel(value);
				hasChanged = true;
			}

			value = $("webui.showDetails").checked;
			if (this.config.showDetails != value) {
				this.toggleDetPanel(value);
				hasChanged = true;
			}

			value = $("webui.showStatusBar").checked;
			if (this.config.showStatusBar != value) {
				this.toggleStatusBar(value);
				hasChanged = true;
			}

			value = ($("webui.maxRows").get("value").toInt() || 0);
			if (value < this.limits.minTableRows) {
				value = (value <= 0 ? 0 : this.limits.minTableRows);
				$("webui.maxRows").set("value", value);
			}
			if (this.config.maxRows != value) {
				this.tableSetMaxRows(value);
				hasChanged = true;
			}

			value = $("webui.useSysFont").checked;
			if (this.config.useSysFont != value) {
				this.toggleSystemFont(value);
				hasChanged = true;
			}
		}

		value = $("webui.lang").get("value");
		if (this.config.lang != value) {
			this.config.lang = value;
			loadLangStrings({"lang": value});
			hasChanged = true;
		}

		var data = {};

		if (hasChanged && Browser.opera)
            data["webui.cookie"] = JSON.encode(this.config);

		value = this.getAdvSetting("gui.graph_legend");
		if (undefined != value && !!this.settings["gui.graph_legend"] != value) {
			this.spdGraph.showLegend(value);
		}

		value = this.getAdvSetting("gui.graphic_progress");
		if (undefined != value && !!this.settings["gui.graphic_progress"] != value) {
			this.tableUseProgressBar(value);
		}

		value = this.getAdvSetting("gui.tall_category_list");

		for (var key in this.settings) {
			var ele = $(key);
			if (!ele) continue;
			// Clicking save settings should not log in/out remote
			if (key === 'webui.uconnect_enable' || key === 'webui.uconnect_username') continue;
			var v = this.settings[key], nv;
			if (ele.type == "checkbox") {
				nv = ele.checked;
			} else {
				nv = ele.get("value");
			}
			switch (key) {
				case "seed_ratio": nv *= 10; break;
				case "seed_time": nv *= 60; break;

				case "search_list":
					nv = nv.split('\n').map(function(item) {
						return item.replace(/[\r\n]+/g, '');
					}).join('\r\n');
				break;
			}
			if (v != nv) {
				this.settings[key] = nv;
				if (key == "multi_day_transfer_mode") {
                    data["multi_day_transfer_mode_ul"] = (nv == 0);
                    data["multi_day_transfer_mode_dl"] = (nv == 1);
                    data["multi_day_transfer_mode_uldl"] = (nv == 2);

					continue;
				}
                
                data[key] = nv;
			}
		}
		for (var key in this.advSettings) {
			var nv = this.getAdvSetting(key);
			if (nv === undefined) continue;
			var v = this.settings[key];

			if (v != nv) {
				this.settings[key] = nv;
                data[key] = nv;
			}
		}

		//if (str != "")
		this.request("post", "action=setsetting", data, Function.from(), !reload); // if the page is going to reload make it a synchronous request

		this.toggleSearchBar();
		resizeUI();
	},
	
	"showAbout": function() {
		DialogManager.show("About");
	},

	"showAddTorrent": function() {
		DialogManager.show("Add");
	},

	"showAddURL": function() {
		DialogManager.show("AddURL");
	},

	"showAddLabel": function() {
		DialogManager.show("AddLabel");
	},
    
	"showSettings": function() {
		//this.animateToggle(true);
		DialogManager.show("Settings");
	},
	
	"hideSettings": function(load_settings) {
		if(load_settings)
			utWebUI.loadSettings();
			
		DialogManager.hide("Settings");
	},
	
	"animateToggle": function(show) {
		var _top = show ? '0%' : '-100%';
		
		if(show)
			jQuery("#settingsHider").addClass('open');
		
		jQuery('#dlgSettings')
			.addClass('moving')
			.animate({ top: _top }, 350, 'linear', 
				function(){
					jQuery(this).removeClass('moving');
					jQuery("#settingsHider").toggleClass('open', show);
				}
			);
	},

	"searchExecute": function() {
		var searchQuery = encodeURIComponent($("query").get("value"));
		var searchActive = (this.settings["search_list_sel"] || 0);
		var searchURLs = (this.settings["search_list"] || "").split("\r\n");

		searchURLs = searchURLs.map(function(item) {
			if (item && (item = item.split("|")[1])) {
				if (!item.test(/%s/)) item += "%s";
				return item.replace(/%v/, "utWebUI").replace(/%s/, searchQuery);
			}
		}).filter($chk);

		if (searchURLs[searchActive])
			openURL(searchURLs[searchActive]);
	},

	"searchMenuSet": function(index) {
		// TODO: Generalize settings storage requests
		this.request("post", "action=setsetting", { "search_list_sel": index });

		this.settings["search_list_sel"] = index;
		$("query").focus();
	},

	"searchMenuShow": function(ele) {
		var searchActive = (this.settings["search_list_sel"] || 0);
		var searchURLs = (this.settings["search_list"] || "").split("\r\n");

		searchURLs = searchURLs.map(function(item) {
			if (item)
				return (item.split("|")[0] || "").replace(/ /g, "&nbsp;");
			else
				return "";
		});

		ContextMenu.clear();
		var index = 0
		Array.each(searchURLs, function(item) {
			if (!item) {
				ContextMenu.add([CMENU_SEP]);
			}
			else {
				if (index == searchActive)
					ContextMenu.add([CMENU_SEL, item]);
				else
					ContextMenu.add([item, this.searchMenuSet.bind(this, index)]);

				++index;
			}
		}, this);

		var pos = ele.getPosition(), size = ele.getSize();
		pos.x += size.x / 2;
		pos.y += size.y / 2;
		ContextMenu.show(pos);
	},

	"generateSpeedList": function(curSpeed, itemCount) {
		var LOGBASE = Math.log(3);

		curSpeed = parseInt(curSpeed, 10) || 0;
		itemCount = parseInt(itemCount || 15, 10) || 0;
		if (itemCount < 5) itemCount = 5;

		// Generate items
		var scale = (curSpeed <= 0 ? 3 : (Math.log(curSpeed) / LOGBASE));
		var scaleinc = (scale / itemCount);
		var list = (curSpeed > 0 ? [curSpeed] : []);
		var first = 0;

		for (var i = 1, curscale = (scale - 2).max(0); i <= itemCount; ++i, curscale += scaleinc) {
			var offset = i * Math.round(Math.pow(2, curscale));

			if (offset < curSpeed) {
				list.unshift(curSpeed - offset);
				++first;
			}
			list.push(curSpeed + offset);
		}

		// TODO: Consider post-processing items so they "look" nicer (intervals of 5, 10, 25, etc)

		// Determine front of list
		for (var i = (itemCount / 2) - 1; first > 0 && list[first] > 0 && i > 0; --i) {
			--first;
		}

		return [0, -1].concat(list.slice(first, first+itemCount));
	},

	"statusMenuShow": function(ev) {
		// Build menu items
		var menuItems = [
			  [CMENU_CHILD, L_("MM_FILE"), [
				  [L_("MM_FILE_ADD_TORRENT"), this.showAddTorrent.bind(this)]
				, [L_("MM_FILE_ADD_URL"), this.showAddURL.bind(this)]
			]]
			, [CMENU_CHILD, L_("MM_OPTIONS"), [
				  [L_("MM_OPTIONS_PREFERENCES"), this.showSettings.bind(this)]
				, [CMENU_SEP]
				, [L_("MM_OPTIONS_SHOW_TOOLBAR"), this.toggleToolbar.bind(this, undefined)]
				, [L_("MM_OPTIONS_SHOW_DETAIL"), this.toggleDetPanel.bind(this, undefined)]
				, [L_("MM_OPTIONS_SHOW_STATUS"), this.toggleStatusBar.bind(this, undefined)]
				, [L_("MM_OPTIONS_SHOW_CATEGORY"), this.toggleCatPanel.bind(this, undefined)]
				, [CMENU_SEP]
				, [L_("MM_OPTIONS_TAB_ICONS"), this.toggleDetPanelIcons.bind(this, undefined)]
			]]
			, [CMENU_CHILD, L_("MM_HELP"), [
				  [L_("MM_HELP_UT_WEBPAGE"), openURL.pass(["http://www.hdkn.net/", null])] 
				, [L_("MM_HELP_UT_FORUMS"), openURL.pass(["http://forums.hdkn.net/", null])] 
				, [CMENU_SEP]
				, [L_("MM_HELP_WEBUI_FEEDBACK"), openURL.pass(["http://forums.hdkn.net", null])] 
				, [CMENU_SEP]
				, [L_("MM_HELP_ABOUT_WEBUI"), this.showAbout.bind(this)]
			]]
			, [CMENU_SEP]
			, [CMENU_CHILD, L_("STM_TORRENTS"), [
				  [L_("STM_TORRENTS_PAUSEALL"), this.pauseAll.bind(this)]
				, [L_("STM_TORRENTS_RESUMEALL"), this.unpauseAll.bind(this)]
			]]
		];

		// Process menu items
		// NOTE: Yeah, very nasty code here.
		if (this.config.showToolbar) menuItems[1][2][2].unshift(CMENU_CHECK);
		if (this.config.showDetails) menuItems[1][2][3].unshift(CMENU_CHECK);
		if (this.config.showStatusBar) menuItems[1][2][4].unshift(CMENU_CHECK);
		if (this.config.showCategories) menuItems[1][2][5].unshift(CMENU_CHECK);
		if (this.config.showDetailsIcons) menuItems[1][2][7].unshift(CMENU_CHECK);

		// Show menu
		ContextMenu.clear();
		ContextMenu.add.apply(ContextMenu, menuItems);
		ContextMenu.show(ev.page);
	},

	"statusSpeedMenuShow": function(speed, ev) {
		if (!ev.isRightClick()) return true;

		speed.set = speed.set || Function.from();
		speed.cur = parseInt(speed.cur, 10) || 0;

		switch (typeOf(speed.list)) {
			case 'string':
				speed.list = speed.list.split(",");

			case 'array':
				speed.list = speed.list.map(function(val) {
					return String.from(val).trim();
				});
			break;

			default:
				speed.list = this.generateSpeedList(speed.cur);
		}

		ContextMenu.clear();

		speed.list.each(function(val) {
			val = parseInt(val, 10);
			if (isNaN(val)) return;

			var item;
			switch (val) {
				case -1: item = [CMENU_SEP]; break;
				case 0: item = [L_("MENU_UNLIMITED")]; break;

				default:
					if (val < 0) val *= -1;
					item = [val + " " + L_("SIZE_KB") + g_perSec];
			}

			if (val === speed.cur) {
				item.unshift(CMENU_SEL);
			}
			else {
				item.push(speed.set.pass(val));
			}
			ContextMenu.add(item);
		});

		ContextMenu.show(ev.page);
	},

	"setSpeedDownload": function(val) {
		// TODO: Generalize settings storage requests
		this.request("post", "action=setsetting", { "max_dl_rate": val }, (function() {
			this.settings["max_dl_rate"] = val;

			$("max_dl_rate").set("value", val);
			this.updateStatusBar();
		}).bind(this));
	},

	"setSpeedUpload": function(val) {
		// TODO: Generalize settings storage requests
		this.request("post", "action=setsetting", { "max_ul_rate": val }, (function() {
			this.settings["max_ul_rate"] = val;

			$("max_ul_rate").set("value", val);
			this.updateStatusBar();
		}).bind(this));
	},

	"statusDownloadMenuShow": function(ev) {
		return this.statusSpeedMenuShow({
			  "set": this.setSpeedDownload.bind(this)
			, "cur": this.settings["max_dl_rate"]
			, "list": !!this.settings["gui.manual_ratemenu"] && this.settings["gui.dlrate_menu"]
		}, ev);
	},

	"statusUploadMenuShow": function(ev) {
		return this.statusSpeedMenuShow({
			  "set": this.setSpeedUpload.bind(this)
			, "cur": this.settings["max_ul_rate"]
			, "list": !!this.settings["gui.manual_ratemenu"] && this.settings["gui.ulrate_menu"]
		}, ev);
	},

	"toolbarChevronShow": function(ele) {
		var missingItems = [];

		var eleTB = $("mainToolbar");
		eleTB.getElements(".inchev").each(function(item) {
			if (item.getPosition(eleTB).y >= eleTB.getHeight()) {
				if (item.hasClass("separator")) {
					missingItems.push([CMENU_SEP]);
				}
				else {
					var mItem = [item.get("title")];
					if (!item.hasClass("disabled")) {
						mItem[1] = function(ev) {
							ev.target = item;
							item.fireEvent("click", ev);
						};
					}

					missingItems.push(mItem);
				}
			}
		});

		while (missingItems.length > 0 && missingItems[0][0] === CMENU_SEP) {
			missingItems.shift();
		}

		ContextMenu.clear();
		if (missingItems.length > 0) {
			ContextMenu.add.apply(ContextMenu, missingItems);

			var pos = ele.getPosition(), size = ele.getSize();
			pos.y += size.y - 2;
			ContextMenu.show(pos);
		}
	},

	"trtDataToRow": function(data) {
		return this.trtColDefs.map(function(item) {
			switch (item[0]) {
				case "added":
					return data[CONST.TORRENT_DATE_ADDED] * 1000;

				case "availability":
					return data[CONST.TORRENT_AVAILABILITY];

				case "completed":
					return data[CONST.TORRENT_DATE_COMPLETED] * 1000;

				case "done":
					return data[CONST.TORRENT_PROGRESS];

				case "downloaded":
					return data[CONST.TORRENT_DOWNLOADED];

				case "downspeed":
					return data[CONST.TORRENT_DOWNSPEED];

				case "eta":
					return data[CONST.TORRENT_ETA];

				case "label":
					return data[CONST.TORRENT_LABEL];

				case "name":
					return data[CONST.TORRENT_NAME];

				case "order":
					return data[CONST.TORRENT_QUEUE_POSITION];

				case "peers":
					return data[CONST.TORRENT_PEERS_CONNECTED] + " (" + data[CONST.TORRENT_PEERS_SWARM] + ")";

				case "ratio":
					return data[CONST.TORRENT_RATIO];

				case "remaining":
					return data[CONST.TORRENT_REMAINING];

				case "seeds":
					return data[CONST.TORRENT_SEEDS_CONNECTED] + " (" + data[CONST.TORRENT_SEEDS_SWARM] + ")";

				case "seeds_peers":
					return (data[CONST.TORRENT_PEERS_SWARM]) ? (data[CONST.TORRENT_SEEDS_SWARM] / data[CONST.TORRENT_PEERS_SWARM]) : Number.MAX_VALUE;

				case "size":
					return data[CONST.TORRENT_SIZE];

				case "status":
					return [data[CONST.TORRENT_STATUS], data[CONST.TORRENT_STATUS_MESSAGE]];

				case "uploaded":
					return data[CONST.TORRENT_UPLOADED];

				case "upspeed":
					return data[CONST.TORRENT_UPSPEED];

				case "url":
					return data[CONST.TORRENT_DOWNLOAD_URL] || "";
			}
		}, this);
	},

	"trtFormatRow": function(values, index) {
		var useidx = $chk(index);
		var len = (useidx ? (index + 1) : values.length);

		var doneIdx = this.trtColDoneIdx, statIdx = this.trtColStatusIdx;
		if (!useidx || index == statIdx) {
			var statInfo = this.getStatusInfo(values[statIdx][0], values[doneIdx], values[doneIdx] === 1000);
			values[statIdx] = (statInfo[0] === "Status_Error" ? values[statIdx][1] || statInfo[1] : statInfo[1]);
		}

		for (var i = (index || 0); i < len; i++) {
			switch (this.trtColDefs[i][0]) {
				case "label":
				case "name":
				case "peers":
				case "seeds":
				case "status":
				case "url":
				break;

				case "added":
				case "completed":
					values[i] = (values[i] > 0) ? new Date(values[i]).toISOString() : "";
				break;

				case "availability":
					values[i] = (values[i] / 65536).toFixedNR(3);
				break;

				case "done":
					values[i] = (values[i] / 10).toFixedNR(1) + "%";
				break;

				case "downloaded":
				case "uploaded":
					values[i] = values[i].toFileSize();
				break;

				case "downspeed":
				case "upspeed":
					values[i] = (values[i] >= 103) ? (values[i].toFileSize() + g_perSec) : "";
				break;

				case "eta":
					values[i] = (values[i] == 0) ? "" :
								(values[i] == -1) ? "\u221E" : values[i].toTimeDelta();
				break;

				case "ratio":
					values[i] = (values[i] == -1) ? "\u221E" : (values[i] / 1000).toFixedNR(3);
				break;

				case "order":
					// NOTE: It is known that this displays "*" for all torrents that are finished
					//       downloading, even those that have reached their seeding goal. This
					//       cannot be fixed perfectly unless we always know a torrent's seeding
					//       goal, which we might not if the torrent's goal overrides the global
					//       defaults. We can't know for sure unless we request getprop for each
					//       and every torrent job, which is expensive.
					values[i] = (values[i] <= -1) ? "*" : values[i];
				break;

				case "remaining":
					values[i] = (values[i] >= 103) ? values[i].toFileSize(2) : "";
				break;

				case "seeds_peers":
					values[i] = ($chk(values[i]) && (values[i] != Number.MAX_VALUE)) ? values[i].toFixedNR(3) : "\u221E";
				break;

				case "size":
					values[i]  = values[i].toFileSize(2);
				break;
			}
		}

		if (useidx)
			return values[index];
		else
			return values;
	},

	"trtSortCustom": function(col, dataX, dataY) {
		var ret = 0;

		switch (this.trtColDefs[col][0]) {
			case "status":
				var statX = dataX[col][0], statY = dataY[col][0];
				ret = ((statY & CONST.STATE_ERROR) - (statX & CONST.STATE_ERROR)); // errored sorts before unerrored
				if (!ret) {
					ret = ((statY & CONST.STATE_CHECKING) - (statX & CONST.STATE_CHECKING)); // checking sorts before non-checking
					if (!ret) {
						ret = ((statY & CONST.STATE_STARTED) - (statX & CONST.STATE_STARTED)); // started sorts before unstarted
						if (!ret) {
							ret = ((statY & CONST.STATE_PAUSED) - (statX & CONST.STATE_PAUSED)); // paused sorts before unpaused
							if (!ret) {
								ret = (dataX[this.trtColDoneIdx] - dataY[this.trtColDoneIdx]); // lower progress sorts before higher progress
								if (!ret) {
									// some default tie-breaker
									if (dataX[0] < dataY[0]) {
										ret = -1;
									}
									else if (dataX[0] > dataY[0]) {
										ret = 1;
									}
									else {
										ret = 0;
									}
								}
							}
						}
					}
				}
			break;
		}

		return ret;
	},

	"trtSelect": function(ev, id) {
		this.updateToolbar();

		var selHash = this.trtTable.selectedRows;

		if (selHash.length === 0) {
			this.torrentID = "";
			this.clearDetails();
			return;
		}

		this.torrentID = id;

		if (this.config.showDetails) {
			this.showDetails(id);
		}
		if (!isGuest && ev.isRightClick()) {
			this.showTrtMenu.delay(0, this, [ev, id]);
		}
	},

	"trtDblClk": function(id) {
		if (!isGuest && this.trtTable.selectedRows.length == 1) {
			var tor = this.torrents[id];
			var action = parseInt((
				tor[CONST.TORRENT_PROGRESS] == 1000
					? this.settings["gui.dblclick_seed"]
					: this.settings["gui.dblclick_dl"]
			), 10) || CONST.TOR_DBLCLK_SHOW_PROPS;

			switch (action) {
				case CONST.TOR_DBLCLK_SHOW_PROPS:
					this.showProperties();
				break;

				default:
					this.perform((tor[CONST.TORRENT_STATUS] & (CONST.STATE_STARTED | CONST.STATE_QUEUED)) ? "stop" : "start");
			}
		}
	},

	"showTrtMenu": function(ev, id) {
		if (!ev.isRightClick()) return;

		var menuItems = []

		//--------------------------------------------------
		// Label Selection
		//--------------------------------------------------

		var labelIndex = CONST.TORRENT_LABEL;
		var labelSubMenu = [[L_("OV_NEW_LABEL"), this.newLabel.bind(this)]];
		if (!this.trtTable.selectedRows.every(function(item) { return (this.torrents[item][labelIndex] == ""); }, this)) {
			labelSubMenu.push([L_("OV_REMOVE_LABEL"), this.setLabel.bind(this, "")]);
		}
		if (Object.getLength(this.labels) > 0) {
			labelSubMenu.push([CMENU_SEP]);
			$each(this.labels, function(_, label) {
				if (this.trtTable.selectedRows.every(function(item) { return (this.torrents[item][labelIndex] == label); }, this)) {
					labelSubMenu.push([CMENU_SEL, label]);
				}
				else {
					labelSubMenu.push([label, this.setLabel.bind(this, label)]);
				}
			}, this);
		}

		//--------------------------------------------------
		// Build Menu
		//--------------------------------------------------

		var menuItemsMap = {
			  "forcestart" : [L_("ML_FORCE_START"), this.forcestart.bind(this)]
			, "start"      : [L_("ML_START"), this.start.bind(this)]
			, "pause"      : [L_("ML_PAUSE"), this.pause.bind(this)]
			, "stop"       : [L_("ML_STOP"),  this.stop.bind(this)]
			, "queueup"    : [L_("ML_QUEUEUP"), (function(ev) { this.queueup(ev.shift); }).bind(this)]
			, "queuedown"  : [L_("ML_QUEUEDOWN"), (function(ev) { this.queuedown(ev.shift); }).bind(this)]
			, "label"      : [CMENU_CHILD, L_("ML_LABEL"), labelSubMenu]
			, "remove"     : [L_("ML_REMOVE"), this.remove.bind(this, CONST.TOR_REMOVE)]
			, "removeand"  : [CMENU_CHILD, L_("ML_REMOVE_AND"), [
				  [L_("ML_DELETE_TORRENT"), this.remove.bind(this, CONST.TOR_REMOVE_TORRENT)]
				, [L_("ML_DELETE_DATATORRENT"), this.remove.bind(this, CONST.TOR_REMOVE_DATATORRENT)]
				, [L_("ML_DELETE_DATA"), this.remove.bind(this, CONST.TOR_REMOVE_DATA)]
			]]
			, "recheck"    : [L_("ML_FORCE_RECHECK"), this.recheck.bind(this)]
			, "copymagnet" : [L_("ML_COPY_MAGNETURI"), this.torShowMagnetCopy.bind(this)]
			, "copy"       : [L_("MENU_COPY"), this.torShowCopy.bind(this)]
			, "properties" : [L_("ML_PROPERTIES"), this.showProperties.bind(this)]
		};

		// Gray out items based on status
		var disabled = this.getDisabledActions();

		Object.each(disabled, function(disabled, name) {
			var item = menuItemsMap[name];
			if (!item) return;

			if (disabled) {
				delete item[1];
			}
		});

		// Create item array
		menuItems = menuItems.concat([
			  menuItemsMap["forcestart"]
			, menuItemsMap["start"]
			, menuItemsMap["pause"]
			, menuItemsMap["stop"]
			, [CMENU_SEP]
			, menuItemsMap["queueup"]
			, menuItemsMap["queuedown"]
			, menuItemsMap["label"]
			, [CMENU_SEP]
			, menuItemsMap["remove"]
			, menuItemsMap["removeand"]
			, [CMENU_SEP]
			, menuItemsMap["recheck"]
			, [CMENU_SEP]
			, menuItemsMap["copymagnet"]
			, menuItemsMap["copy"]
			, [CMENU_SEP]
			, menuItemsMap["properties"]
		]);

		//--------------------------------------------------
		// Draw Menu
		//--------------------------------------------------

		ContextMenu.clear();
		ContextMenu.add.apply(ContextMenu, menuItems);
		ContextMenu.show(ev.page);
	},

	"torShowCopy": function() {
		this.showCopy(L_("MENU_COPY"), this.trtTable.copySelection());
	},

	"torShowMagnetCopy": function() {
		var txtArray = [];
		this.trtTable.getSortedSelection().each(function(hash) {
			txtArray.push("magnet:?xt=urn:btih:" + hash + "&dn=" + encodeURIComponent(this.torrents[hash][CONST.TORRENT_NAME]));
		}, this);

		this.showCopy(L_("ML_COPY_MAGNETURI"), txtArray.join("\r\n"));
	},

	"showCopy": function(title, txt) {
		DialogManager.popup({
			  title: title
			, icon: "dlgIcon-Copy"
			, width: "35em"
			, input: txt
			, buttons: [{ text: L_("DLG_BTN_CLOSE") }]
		});
	},

	"showProperties": function(k) {
		var count = this.trtTable.selectedRows.length;
		if (count <= 0) return;

		this.propID = (count > 1) ? "multi" : this.trtTable.selectedRows[0];
		if (this.propID != "multi")
			this.request("get", "action=getprops&hash=" + this.propID, null, this.loadProperties);
		else
			this.updateMultiProperties();
	},

	"loadProperties": function(json) {
		var props = json.props[0], id = this.propID;
		if (!has(this.props, id))
			this.props[id] = {};
		for (var k in props)
			this.props[id][k] = props[k];
		this.updateProperties();
	},

	"updateMultiProperties": function() {
		$("prop-trackers").value = "";
		$("prop-ulrate").value = "";
		$("prop-dlrate").value = "";
		$("prop-ulslots").value = "";
		$("prop-seed_ratio").value = "";
		$("prop-seed_time").value = "";
		$("prop-superseed").checked = "";
		var ele = $("prop-seed_override");
		ele.checked = false;
		ele.disabled = true;
		ele.fireEvent(Browser.ie ? "click" : "change");
		$("DLG_TORRENTPROP_1_GEN_11").addStopEvent("click", function(ev) {
			ele.disabled = !ele.disabled;
		});
		var ids = {
			"superseed": 17,
			"dht": 18,
			"pex": 19
		};
		Object.each(ids, function(v, k) {
			var e = $("prop-" + k);
			e.disabled = true;
			e.checked = false;
			$("DLG_TORRENTPROP_1_GEN_" + v).removeClass("disabled").addStopEvent("click", function(ev) {
				e.disabled = !e.disabled;
			});
		});
		if (window.utweb === undefined) {
			$("dlgProps-head").set("text", "|[" + this.trtTable.selectedRows.length + " Torrents]| - " + L_("DLG_TORRENTPROP_00"));
		}
		DialogManager.show("Props");
	},

	"updateProperties": function() {
		var props = this.props[this.propID];
		$("prop-trackers").value = props.trackers;
		$("prop-ulrate").value = (props.ulrate / 1024).toInt();
		$("prop-dlrate").value = (props.dlrate / 1024).toInt();
		$("prop-ulslots").value = props.ulslots;
		var ele = $("prop-seed_override");
		ele.disabled = false;
		ele.checked = !!props.seed_override;
		ele.fireEvent(Browser.ie ? "click" : "change");
		$("prop-seed_ratio").value = props.seed_ratio / 10;
		$("prop-seed_time").value = props.seed_time / 60;
		$("prop-superseed").checked = props.superseed;
		var ids = {
			"superseed": 17,
			"dht": 18,
			"pex": 19
		};
		for (var k in ids) {
			var dis = (props[k] == -1);
			if (k == "dht")
				dis = !this.settings["dht_per_torrent"];
			ele = $("prop-" + k);
			ele.disabled = dis;
			ele.checked = (props[k] == 1);
			$("DLG_TORRENTPROP_1_GEN_" + ids[k])[dis ? "addClass" : "removeClass"]("disabled");
		}
		if (window.utweb === undefined) {
			$("dlgProps-head").set("text", this.torrents[this.propID][CONST.TORRENT_NAME] + " - " + L_("DLG_TORRENTPROP_00"));
		}
		DialogManager.show("Props");
	},

	"setProperties": function() {
		var isMulti = ("multi" === this.propID);
		var props = this.props[this.propID];

        var data = {};
		for (var key in props) {
			var ele = $("prop-" + key);
			if (!ele) continue;
			var v = props[key], nv;
			if (!isMulti && (v == -1) && ((key == "dht") || (key == "pex"))) continue;
			if (ele.type == "checkbox") {
				if (isMulti && ele.disabled) continue;
				nv = ele.checked ? 1 : 0;
			} else {
				nv = ele.get("value");
				if (isMulti && (nv == "")) continue;
			}
			switch (key) {
				case "seed_ratio": nv *= 10; break;
				case "seed_time": nv *= 60; break;

				case "dlrate":
				case "ulrate":
					nv *= 1024;
				break;

				case "trackers":
					nv = nv.split('\n').map(function(item) {
						return item.replace(/[\r\n]+/g, '');
					}).join('\r\n');
				break
			}
			if (isMulti || v != nv) {
                data[key] = nv;
				if (!isMulti) props[key] = nv;
			}
		}
		if (isMulti) {
			[11, 17, 18, 19].each(function(v) {
				$("DLG_TORRENTPROP_1_GEN_" + v).removeEvents("click");
			});
		}
		this.propID = "";

        var tdata = {};
        
        for(var i = 0; i < this.trtTable.selectedRows.length; i++)
        {
            tdata[this.trtTable.selectedRows[i]] = data;
        }
        
        this.request("post", "action=setprops", tdata);
	},

	"showDetails": function(id) {
		var force = (id !== undefined);

		if (force) this.torrentID = id;
		else id = this.torrentID;

		if (!(this.config || {}).showDetails) return;

		switch (this.mainTabs.active) { // TODO: Cleanup... (don't allow direct access to internals)
			case "mainInfoPane-generalTab":
				this.updateDetails(id);
			break;

			case "mainInfoPane-peersTab":
				this.getPeers(id, force);
			break;

			case "mainInfoPane-filesTab":
				this.getFiles(id, force);
			break;
		}
	},

	"clearDetails": function() {
		["rm", "dl", "ul", "ra", "us", "ds", "se", "pe", "sa", "hs"].each(function(id) {
			$(id).set("html", "");
		});
		this.prsTable.clearRows();
		this.flsTable.clearRows();
	},

	"updateDetails": function(id) {
		if (!id) return;

		var d = this.torrents[id];
		$("dl").set("html", d[CONST.TORRENT_DOWNLOADED].toFileSize());
		$("ul").set("html", d[CONST.TORRENT_UPLOADED].toFileSize());
		$("ra").set("html", (d[CONST.TORRENT_RATIO] == -1) ? "\u221E" : (d[CONST.TORRENT_RATIO] / 1000).toFixedNR(3));
		$("us").set("html", d[CONST.TORRENT_UPSPEED].toFileSize() + g_perSec);
		$("ds").set("html", d[CONST.TORRENT_DOWNSPEED].toFileSize() + g_perSec);
		$("rm").set("html", (d[CONST.TORRENT_ETA] == 0) ? "" : (d[CONST.TORRENT_ETA] <= -1) ? "\u221E" : d[CONST.TORRENT_ETA].toTimeDelta());
		$("se").set("html", L_("GN_XCONN").replace(/%d/, d[CONST.TORRENT_SEEDS_CONNECTED]).replace(/%d/, d[CONST.TORRENT_SEEDS_SWARM]).replace(/%d/, "\u00BF?"));
		$("pe").set("html", L_("GN_XCONN").replace(/%d/, d[CONST.TORRENT_PEERS_CONNECTED]).replace(/%d/, d[CONST.TORRENT_PEERS_SWARM]).replace(/%d/, "\u00BF?"));
		$("sa").set("html", d[CONST.TORRENT_SAVE_PATH] || "");
		$("hs").set("html", id);
	},

	"addFile": function(param, fn) {
		var files = Array.from(param.file);
		if (files.length <= 0) return;

		var count = 0;
		var fnwrap = (function() {
			if (++count === files.length) fn();
		});

		var qs = "action=add-file"
		var val;

		if ((val = (parseInt(param.dir, 10) || 0)))
			qs += "&download_dir=" + val;

		if ((val = (param.sub || "")))
			qs += "&path=" + encodeURIComponent(val); // TODO: Sanitize!

		Array.each(files, function(file) {

			// TODO: Finish implementing!
			//
			// NOTE: Not implemented because I don't feel like the FileReader
			//       standard is completely stabilized, with browsers having
			//       spotty support for it. Too, it would probably be better to
			//       wait for MooTools to implement the requisite interfaces
			//       natively rather than hack it in myself only to  have to
			//       toss it all out again later.
			//
			//       Once finished, we can rewrite the ADD_FILE_OK click event
			//       handler to use this API rather than having it do everything
			//       manually. May have to be an indirect usage so that we can
			//       fall back gracefully for older browsers.

		}, this);
	},
	
	"setLabel": function(param, fn) {
		var torrents = this.trtTable.selectedRows;
        var self = this;
        
        var data = {};
        
        for(var i = 0; i < torrents.length; i++)
        {
            var id = torrents[i];
            
            data[id] = {};
            data[id].label = param;
        }
        
        this.request("post", "action=setprops", data, fn);
	},	

	"addURL": function(param, fn) {
        this.request("post", "action=addurl", param, fn);
	},

	"loadPeers": function() {
		this.prsTable.keepScroll((function() {
			this.prsTable.clearRows(true);

			var id = this.torrentID;
			if (id === this.peerlist._ID_) {
				this.peerlist.each(function(peer, i) {
					var key = id + "_" + peer[CONST.PEER_IP].replace(/[\.:]/g, "_") + "_" + peer[CONST.PEER_PORT]; // TODO: Handle bt.allow_same_ip
					this.prsTable.addRow(this.prsDataToRow(peer), key, "country country_" + peer[CONST.PEER_COUNTRY]);
				}, this);
			}
		}).bind(this));

		this.prsTable.calcSize();
		this.prsTable.resizePads();
		this.prsTable.refresh();
	},

	"getPeers": function(id, forceload) {
		if (id === undefined) id = this.torrentID;
		if (!id) return;

		var now = Date.now();
		if (forceload || this.peerlist._ID_ !== id || !this.peerlist._TIME_ || (now - this.peerlist._TIME_) > (this.limits.minPeerListCache * 1000)) {
			this.request("get", "action=getpeers&hash=" + id, null, (function(json) {
				this.peerlist.empty();

				var peers = json.peers;
				if (peers) {
					for (var i = 0; i < peers.length; i += 2) {
						if (peers[i] === id) {
							this.peerlist = peers[i+1];
							break;
						}
					}
				}

				this.peerlist._TIME_ = now;
				this.peerlist._ID_ = id;

				this.loadPeers();
			}).bind(this));
		}
		else {
//			this.loadPeers();
		}
	},

	"loadFiles": function() {
		this.flsTable.keepScroll((function() {
			this.flsTable.clearRows(true);

			var id = this.torrentID;
			if (id === this.filelist._ID_) {
				this.filelist.each(function(file, i) {
					this.flsTable.addRow(this.flsDataToRow(file), id + "_" + i);
				}, this);
			}
		}).bind(this));

		this.flsTable.calcSize();
		this.flsTable.resizePads();
		this.flsTable.refresh();
	},

	"getFiles": function(id, forceload) {
		if (id === undefined) id = this.torrentID;
		if (!id) return;

		var now = Date.now();
		if (forceload || this.filelist._ID_ !== id || !this.filelist._TIME_ || (now - this.filelist._TIME_) > (this.limits.minFileListCache * 1000)) {
			this.request("get", "action=gettorrentfiles&hash=" + id, null, (function(json) {
				this.filelist.empty();

				var files = json.files;
				if (files) {
					for (var i = 0; i < files.length; i += 2) {
						if (files[i] === id) {
							this.filelist = files[i+1];
							break;
						}
					}
				}

				this.filelist._TIME_ = now;
				this.filelist._ID_ = id;

				this.loadFiles();
			}).bind(this));
		}
		else {
//			this.loadFiles();
		}
	},

	"flsDataToRow": function(data) {
		return this.flsColDefs.map(function(item) {
			switch (item[0]) {
				case "done":
					return data[CONST.FILE_DOWNLOADED];

				case "firstpc":
					return data[CONST.FILE_FIRST_PIECE];

				case "name":
					return data[CONST.FILE_NAME];

				case "numpcs":
					return data[CONST.FILE_NUM_PIECES];

				case "pcnt":
					return data[CONST.FILE_DOWNLOADED] / data[CONST.FILE_SIZE] * 1000;

				case "prio":
					return data[CONST.FILE_PRIORITY];

				case "size":
					return data[CONST.FILE_SIZE];
			}
		}, this);
	},

	"flsFormatRow": function(values, index) {
		var useidx = $chk(index);
		var len = (useidx ? (index + 1) : values.length);

		for (var i = (index || 0); i < len; i++) {
			switch (this.flsColDefs[i][0]) {
				case "name":
				break;

				case "done":
				case "size":
					values[i] = values[i].toFileSize(2);
				break;

				case "firstpc":
				case "numpcs":
					values[i] = [values[i], ""].pick();
				break;

				case "pcnt":
					values[i] = (values[i] / 10).toFixedNR(1) + "%";
				break;

				case "prio":
					values[i] = L_("FI_PRI" + values[i]);
				break;
			}
		}


		if (useidx)
			return values[index];
		else
			return values;
	},

	"flsSelect": function(ev, id) {
		if (ev.isRightClick() && this.flsTable.selectedRows.length > 0)
			this.showFileMenu.delay(0, this, ev);
	},

	"showFileMenu": function(ev) {
		if (isGuest || !ev.isRightClick()) return;

		var id = this.torrentID;

		var fileIds = this.getSelFileIds();
		if (fileIds.length <= 0) return;

		var menuItems = [];

		//--------------------------------------------------
		// Priority Selection
		//--------------------------------------------------

		var prioItems = [
			  [L_("MF_DONT"), this.setPriority.pass([id, CONST.FILEPRIORITY_SKIP], this)]
			, [CMENU_SEP]
			, [L_("MF_LOW"), this.setPriority.pass([id, CONST.FILEPRIORITY_LOW], this)]
			, [L_("MF_NORMAL"), this.setPriority.pass([id, CONST.FILEPRIORITY_NORMAL], this)]
			, [L_("MF_HIGH"), this.setPriority.pass([id, CONST.FILEPRIORITY_HIGH], this)]
		];

		// Gray out priority items based on priorities of selected files
		var p = this.filelist[fileIds[0]][CONST.FILE_PRIORITY];
		for (var i = 1, l = fileIds.length; i < l; ++i) {
			if (p != this.filelist[fileIds[i]][CONST.FILE_PRIORITY]) {
				p = -1;
				break;
			}
		}
		if (p >= 0) {
			if (p > 0) ++p;
			delete prioItems[p][1];
		}

		menuItems = menuItems.concat(prioItems.reverse());

		//--------------------------------------------------
		// File Download
		//--------------------------------------------------

		var fileDownloadItems = [
			  [CMENU_SEP]
			, [L_("MF_GETFILE"), this.downloadFiles.bind(this, id)]
		];

		// Gray out download item if no selected file is complete
		var goodFile = false;
		for (var i = 0, l = fileIds.length; i < l; ++i) {
			var data = this.filelist[fileIds[i]];
			if (data[CONST.FILE_DOWNLOADED] == data[CONST.FILE_SIZE]) {
				goodFile = true;
				break;
			}
		}
		if (!goodFile) {
			delete fileDownloadItems[1][1];
		}

		var fdata = this.filelist[fileIds[0]];
		if (fileIds.length > 1 || fdata[CONST.FILE_DOWNLOADED] != fdata[CONST.FILE_SIZE]) {
		}

		menuItems = menuItems.concat(fileDownloadItems);

		//--------------------------------------------------
		// Miscellaneous Items
		//--------------------------------------------------
		menuItems = menuItems.concat([
			  [CMENU_SEP]
			, [L_("MENU_COPY"), this.flsShowCopy.bind(this)]
		]);

		//--------------------------------------------------
		// Draw Menu
		//--------------------------------------------------

		ContextMenu.clear();
		ContextMenu.add.apply(ContextMenu, menuItems);
		ContextMenu.show(ev.page);
	},

	"flsShowCopy": function() {
		this.showCopy(L_("MENU_COPY"), this.flsTable.copySelection());
	},

	"getSelFileIds": function() {
		var ids = [];

		var len = this.flsTable.selectedRows.length;
		while (len--) {
			var rowId = this.flsTable.selectedRows[len];
			var fileId = rowId.match(/.*_([0-9]+)$/)[1].toInt();
			ids.push(fileId);
		}

		return ids;
	},

	"downloadFiles": function(id) {
		var selIds = this.getSelFileIds();

		var fileIds = [];
		$each(selIds, function(fid) {
			var data = this.filelist[fid];
			if (data[CONST.FILE_DOWNLOADED] == data[CONST.FILE_SIZE]) {
				fileIds.push(fid);
			}
		}, this);

		if (fileIds.length <= 0) return;

		this.proxyFiles(this.torrents[id][CONST.TORRENT_STREAM_ID], fileIds, false);
	},

	"setPriority": function(id, p) {
		var fileIds = this.getSelFileIds().filter(function(fileId) {
			return (this.filelist[fileId][CONST.FILE_PRIORITY] != p);
		}, this);
		if (fileIds.length <= 0) return;

        var data = {};
        data[id] = [];
        
        for(var i = 0; i < fileIds.length; i++)
        {
            data[id].push({ "file": fileIds[i], "priority": p });
        }
        
		this.request("post", "action=setprio", data, (function() {
			$each(fileIds, function(v) {
				var rowId = id + "_" + v;
				this.filelist[v][CONST.FILE_PRIORITY] = p;

				this.flsTable.rowData[rowId].data[this.flsColPrioIdx] = p;
				this.flsTable.updateCell(rowId, this.flsColPrioIdx);
			}, this);
		}).bind(this));
	},

	"trtColReset": function() {
		var config = {
			  "colMask": 0
			, "colOrder": this.trtColDefs.map(function(item, idx) { return idx; })
			, "colWidth": this.trtColDefs.map(function(item, idx) { return item[1]; })
		};

		this.trtColDefs.each(function(item, idx) { if (!!item[3]) config.colMask |= (1 << idx); });

		this.trtTable.setConfig(config);
		Object.append(this.config.torrentTable, config);
		if (Browser.opera)
			this.saveConfig(true);
	},

	"trtSort": function(index, reverse) {
		this.config.torrentTable.sIndex = index;
		this.config.torrentTable.reverse = reverse;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"trtColMove": function() {
		this.config.torrentTable.colOrder = this.trtTable.colOrder;
		this.config.torrentTable.sIndex = this.trtTable.sIndex;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"trtColResize": function() {
		this.config.torrentTable.colWidth = this.trtTable.getColumnWidths();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"trtColToggle": function(index, enable, nosave) {
		var num = 1 << index;
		if (enable) {
			this.config.torrentTable.colMask |= num;
		} else {
			this.config.torrentTable.colMask &= ~num;
		}
		if (!nosave && Browser.opera)
			this.saveConfig(true);
	},

	"showGeneralMenu": function(ev) {
		if (isGuest || !ev.isRightClick()) return;

		var menuItems = [
			[L_("MENU_COPY"), this.showCopy.bind(this, L_("MENU_COPY"), ev.target.get("text"))]
		];

		//--------------------------------------------------
		// Draw Menu
		//--------------------------------------------------

		ContextMenu.clear();
		ContextMenu.add.apply(ContextMenu, menuItems);
		ContextMenu.show(ev.page);

		// Prevent global click handler from hiding the menu
		ev.stopPropagation();
	},

	"prsColMove": function() {
		this.config.peerTable.colOrder = this.prsTable.colOrder;
		this.config.peerTable.sIndex = this.prsTable.sIndex;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"prsColReset": function() {
		var config = {
			  "colMask": 0
			, "colOrder": this.prsColDefs.map(function(item, idx) { return idx; })
			, "colWidth": this.prsColDefs.map(function(item, idx) { return item[1]; })
		};

		this.prsColDefs.each(function(item, idx) { if (!!item[3]) config.colMask |= (1 << idx); });

		this.prsTable.setConfig(config);
		Object.append(this.config.peerTable, config);
		if (Browser.opera)
			this.saveConfig(true);
	},

	"prsColResize": function() {
		this.config.peerTable.colWidth = this.prsTable.getColumnWidths();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"prsColToggle": function(index, enable, nosave) {
		var num = 1 << index;
		if (enable) {
			this.config.peerTable.colMask |= num;
		} else {
			this.config.peerTable.colMask &= ~num;
		}
		if (!nosave && Browser.opera)
			this.saveConfig(true);
	},

	"prsDataToRow": function(data) {
		return this.prsColDefs.map(function(item) {
			switch (item[0]) {
				case "ip":
					return (
						  ((this.settings["resolve_peerips"] && data[CONST.PEER_REVDNS]) || data[CONST.PEER_IP])
						+ (data[CONST.PEER_UTP] ? " [uTP]" : "")
					);

				case "port":
					return data[CONST.PEER_PORT];

				case "client":
					return data[CONST.PEER_CLIENT];

				case "flags":
					return data[CONST.PEER_FLAGS];

				case "pcnt":
					return data[CONST.PEER_PROGRESS];

				case "relevance":
					return data[CONST.PEER_RELEVANCE];

				case "downspeed":
					return data[CONST.PEER_DOWNSPEED];

				case "upspeed":
					return data[CONST.PEER_UPSPEED];

				case "reqs":
					return data[CONST.PEER_REQS_OUT] + "|" + data[CONST.PEER_REQS_IN];

				case "waited":
					return data[CONST.PEER_WAITED];

				case "uploaded":
					return data[CONST.PEER_UPLOADED];

				case "downloaded":
					return data[CONST.PEER_DOWNLOADED];

				case "hasherr":
					return data[CONST.PEER_HASHERR];

				case "peerdl":
					return data[CONST.PEER_PEERDL];

				case "maxup":
					return data[CONST.PEER_MAXUP];

				case "maxdown":
					return data[CONST.PEER_MAXDOWN];

				case "queued":
					return data[CONST.PEER_QUEUED];

				case "inactive":
					return data[CONST.PEER_INACTIVE];
			}
		}, this);
	},

	"prsFormatRow": function(values, index) {
		var useidx = $chk(index);
		var len = (useidx ? (index + 1) : values.length);

		for (var i = (index || 0); i < len; i++) {
			switch (this.prsColDefs[i][0]) {
				case "ip":
				case "port":
				case "client":
				case "flags":
				case "reqs":
				break;

				case "pcnt":
				case "relevance":
					values[i] = (values[i] / 10).toFixedNR(1) + "%";
				break;

				case "uploaded":
				case "downloaded":
				case "hasherr":
				case "queued":
					values[i] = (values[i] > 103) ? values[i].toFileSize() : "";
				break;

				case "downspeed":
				case "upspeed":
				case "peerdl":
				case "maxup":
				case "maxdown":
					values[i] = (values[i] > 103) ? (values[i].toFileSize() + g_perSec) : "";
				break;

				case "waited":
				case "inactive":
					values[i] = (values[i] == 0) ? "" :
								(values[i] == -1) ? "\u221E" : values[i].toTimeDelta();
				break;
			}
		}

		if (useidx)
			return values[index];
		else
			return values;
	},

	"toggleResolveIP": function() {
		this.settings["resolve_peerips"] = !this.settings["resolve_peerips"];

		// TODO: Generalize settings storage requests
		this.request("post", "action=setsetting", { "resolve_peerips": (this.settings["resolve_peerips"] ? 1 : 0) }, (function() {
			if (this.torrentID != "")
				this.getPeers(this.torrentID, true);
		}).bind(this));
	},

	"prsSelect": function(ev, id) {
		if (ev.isRightClick())
			this.showPeerMenu.delay(0, this, ev);
	},

	"showPeerMenu": function(ev) {
		if (isGuest || !ev.isRightClick()) return;

		var menuItems = [
			  [L_("MP_RESOLVE_IPS"), this.toggleResolveIP.bind(this)]
			, [CMENU_SEP]
			, [L_("MENU_COPY"), this.prsShowCopy.bind(this)]
		];

		// Process menu items
		// NOTE: Yeah, very nasty code here.
		if (this.settings["resolve_peerips"]) {
			menuItems[0].splice(0, 0, CMENU_CHECK);
		}

		//--------------------------------------------------
		// Draw Menu
		//--------------------------------------------------

		ContextMenu.clear();
		ContextMenu.add.apply(ContextMenu, menuItems);
		ContextMenu.show(ev.page);
	},

	"prsShowCopy": function() {
		this.showCopy(L_("MENU_COPY"), this.prsTable.copySelection());
	},

	"prsSort": function(index, reverse) {
		this.config.peerTable.sIndex = index;
		this.config.peerTable.reverse = reverse;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"flsColReset": function() {
		var config = {
			  "colMask": 0
			, "colOrder": this.flsColDefs.map(function(item, idx) { return idx; })
			, "colWidth": this.flsColDefs.map(function(item, idx) { return item[1]; })
		};

		this.flsColDefs.each(function(item, idx) { if (!!item[3]) config.colMask |= (1 << idx); });

		this.flsTable.setConfig(config);
		Object.append(this.config.fileTable, config);
		if (Browser.opera)
			this.saveConfig(true);
	},

	"flsSort": function(index, reverse) {
		this.config.fileTable.sIndex = index;
		this.config.fileTable.reverse = reverse;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"flsColMove": function() {
		this.config.fileTable.colOrder = this.flsTable.colOrder;
		this.config.fileTable.sIndex = this.flsTable.sIndex;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"flsColResize": function() {
		this.config.fileTable.colWidth = this.flsTable.getColumnWidths();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"flsColToggle": function(index, enable, nosave) {
		var num = 1 << index;
		if (enable) {
			this.config.fileTable.colMask |= num;
		} else {
			this.config.fileTable.colMask &= ~num;
		}
		if (!nosave && Browser.opera)
			this.saveConfig(true);
	},

	"flsDblClk": function(id) {
		if (isGuest) return;
		if (this.flsTable.selectedRows.length != 1) return;
		var hash = id.match(/^(.*?)_.*$/)[1];
		var fid = id.replace(hash + '_', '').toInt() || 0;
		this.setPriority(hash, (this.filelist[fid][CONST.FILE_PRIORITY] + 1) % 4);
	},

	"advOptDataToRow": function(data) {
		return this.advOptColDefs.map(function(item) {
			switch (item[0]) {
				case "name":
					return data[0];

				case "value":
					return data[2];
			}
		}, this);
	},

	"advOptFormatRow": function(values, index) {
		var useidx = $chk(index);
		var len = (useidx ? (index + 1) : values.length);

/*
		for (var i = (index || 0); i < len; i++) {
			switch (this.advOptColDefs[i][0]) {
				case "name":
				case "value":
					break;
			}
		}
*/

		if (useidx)
			return values[index];
		else
			return values;
	},

	"advOptColReset": function() {
		var config = {
			  "colMask": 0
			, "colOrder": this.advOptColDefs.map(function(item, idx) { return idx; })
			, "colWidth": this.advOptColDefs.map(function(item, idx) { return item[1]; })
		};

		this.advOptColDefs.each(function(item, idx) { if (!!item[3]) config.colMask |= (1 << idx); });

		this.advOptTable.setConfig(config);
	},

	"advOptSelect": function(ev, id) {
		var val = this.getAdvSetting(id);
		var contBool = $("dlgSettings-advBool-cont");
		var contText = $("dlgSettings-advText-cont")

		if (undefined != val) {
			// Item clicked
			if (typeOf(val) == 'boolean') {
				contBool.setStyle("display", "inline");
				contText.setStyle("display", "none");

				$("dlgSettings-adv" + (val ? "True" : "False")).checked = true;
			}
			else {
				contBool.setStyle("display", "none");
				contText.setStyle("display", "inline");

				$("dlgSettings-advText").value = val;
			}
		}
		else {
			// Item unclicked
			contBool.setStyle("display", "none");
			contText.setStyle("display", "none");
		}
	},

	"advOptDblClk": function(id) {
		var val = this.getAdvSetting(id);
		if (undefined != val) {
			if (typeOf(val) == 'boolean') {
				$("dlgSettings-adv" + (val ? "False" : "True")).checked = true;
				this.advOptChanged();
			}
		}
	},

	"advOptChanged": function() {
		var optIds = this.advOptTable.selectedRows;
		if (optIds.length > 0) {
			var id = optIds[0];

			switch (typeOf(this.getAdvSetting(id))) {
				case 'boolean':
					this.setAdvSetting(id, $("dlgSettings-advTrue").checked);
				break;

				case 'number':
					this.setAdvSetting(id, $("dlgSettings-advText").value.toInt() || 0);
				break;

				case 'string':
					this.setAdvSetting(id, $("dlgSettings-advText").value);
				break;
			}

			if (id == "bt.transp_disposition") {
				$("enable_bw_management").checked = !!(this.getAdvSetting("bt.transp_disposition") & CONST.TRANSDISP_UTP);
			}
		}
	},

	"restoreUI": function(bc) {
		if ((bc != false) && !confirm("Are you sure that you want to restore the interface?")) return;
		this.showMsg('Reloading WebUI...');
		window.removeEvents("unload");
		this.config = {};
		this.saveConfig(false, function(){ window.location.reload(false); });
	},

	"saveConfig": function(async, callback) {
		if (isGuest) return;
		this.request("post", "action=setsetting", { "webui.cookie": JSON.encode(this.config) }, callback || null, async || false);
	},

	"updateStatusBar": function() {
		var str, seg, val, data;

		// Download
		str = '';

		seg = L_("SB_DOWNLOAD").replace(/%z/, this.totalDL.toFileSize());

		val = '';
		data = this.settings["max_dl_rate"] || 0;
		if (this.settings["gui.limits_in_statusbar"] && data > 0) {
			val = '[' + data + " " + L_("SIZE_KB") + g_perSec + '] ';
		}
		seg = seg.replace(/%s/, val);

		str += seg;

		$("mainStatusBar-download").set("text", str);

		// Upload
		str = '';

		seg = L_("SB_UPLOAD").replace(/%z/, this.totalUL.toFileSize());

		val = '';
		data = this.settings["max_ul_rate"] || 0;
		if (this.settings["gui.limits_in_statusbar"] && data > 0) {
			val = '[' + data + " " + L_("SIZE_KB") + g_perSec + '] ';
		}
		seg = seg.replace(/%s/, val);

		str += seg;

		$("mainStatusBar-upload").set("text", str);
	},

	"updateTitle": function() {
		var str = L_("MAIN_TITLEBAR_SPEED").replace(/%s/, this.totalDL.toFileSize() + g_perSec).replace(/%s/, this.totalUL.toFileSize() + g_perSec);
		window.status = window.defaultStatus = str.replace(/%s/, "");
		if (this.settings["gui.speed_in_title"])
			document.title = str.replace(/%s/, g_winTitle);
	},

	"getDisabledActions": function() {
		var disabled = {
			"forcestart": 1,
			"pause": 1,
			"queuedown": 1,
			"queueup": 1,
			"remove": 1,
			"start": 1,
			"stop": 1
		};

		var selHash = this.trtTable.selectedRows;
		if (selHash.length > 0) {
			var queueSelCount = 0,
				queueSelMin = Number.MAX_VALUE,
				queueSelMax = -Number.MAX_VALUE;

			selHash.each(function(hash) {
				var tor = this.torrents[hash];
                var state = tor[CONST.TORRENT_STATUS];
                
                switch(state)
                {
                    case CONST.STATE_STOPPED:
                    case CONST.STATE_STOPPING:
                        disabled.start = 0;
                        break;
                        
                    case CONST.STATE_PAUSED:
                        disabled.start = disabled.stop = 0;
                        break;
                        
                    case CONST.STATE_DOWNLOADING:
                    case CONST.STATE_SEEDING:
                    case CONST.STATE_METADATA:
                        disabled.stop = disabled.pause = 0;
                        break;
                        
                    case CONST.STATE_HASHING:
                        disabled.stop = 0;
                        break;
                        
                    case CONST.STATE_ERROR:
                        disabled.stop = 0;
                        break;
                        
                    case CONST.STATE_METADATA:
                        break;
                }
			}, this);

			if (queueSelCount < queueSelMax) {
				disabled.queueup = 0;
			}
			if (queueSelMin <= this.torQueueMax - queueSelCount) {
				disabled.queuedown = 0;
			}

			disabled.remove = 0;
		}

		return disabled;
	},

	"updateToolbar": function() {
		if (isGuest) return;

		var disabled = this.getDisabledActions();

		Object.each(disabled, function(disabled, name) {
			var item = $(name);
			if (!item) return;

			if (disabled) {
				item.addClass("disabled");
			}
			else {
				item.removeClass("disabled");
			}
		});
	},

	"toggleCatPanel": function(show) {
		show = (show === undefined
			? !this.config.showCategories
			: !!show
		);

		$("mainCatList")[show ? "show" : "hide"]();
		$("webui.showCategories").checked = show;
		this.config.showCategories = show;

		resizeUI();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"toggleDetPanel": function(show) {
		show = (show === undefined
			? !this.config.showDetails
			: !!show
		);

		$("mainInfoPane")[show ? "show" : "hide"]();
		$("webui.showDetails").checked = show;
		this.config.showDetails = show;
		this.detPanelTabChange();

		resizeUI();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"toggleDetPanelIcons": function(show) {
		show = (show === undefined
			? !this.config.showDetailsIcons
			: !!show
		);

		$("mainInfoPane-tabs")[show ? "addClass" : "removeClass"]("icon");
		this.config.showDetailsIcons = show;

		resizeUI();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"toggleSearchBar": function(show) {
		show = (show === undefined
			? !!(this.settings["search_list"] || "").trim()
			: !!show
		);

		$("mainToolbar-searchbar")[show ? "show" : "hide"]();
	},

	"toggleStatusBar": function(show) {
		show = (show === undefined
			? !this.config.showStatusBar
			: !!show
		);

		$("mainStatusBar")[show ? "show" : "hide"]();
		$("webui.showStatusBar").checked = show;
		this.config.showStatusBar = show;

		resizeUI();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"toggleToolbar": function(show) {
		show = (show === undefined
			? !this.config.showToolbar
			: !!show
		);

		$("mainToolbar")[show ? "show" : "hide"]();
		$("webui.showToolbar").checked = show;
		this.config.showToolbar = show;

		resizeUI();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"toggleSystemFont": function(use) {
		use = (use === undefined
			? !this.config.useSysFont
			: !!use
		);

		document.body[use ? "removeClass" : "addClass"]("nosysfont");
		this.config.useSysFont = use;

		resizeUI();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"tableSetMaxRows": function(max) {
		var virtRows = this.limits.maxVirtTableRows;

		var mode = MODE_PAGE;
		max = max || 0;

		if (max <= 0) {
			mode = MODE_VIRTUAL;
			max = 0;
		}
		else if (max < this.limits.minTableRows) {
			max = this.limits.minTableRows;
		}

		this.config.maxRows = max;
		this.trtTable.setConfig({"rowMaxCount": max || virtRows, "rowMode": mode});
		this.prsTable.setConfig({"rowMaxCount": max || virtRows, "rowMode": mode});
		this.flsTable.setConfig({"rowMaxCount": max || virtRows, "rowMode": mode});
		if (!isGuest) {
			this.advOptTable.setConfig({"rowMaxCount": max || virtRows, "rowMode": mode});
		}
	},

	"tableUseAltColor": function(enable) {
		this.trtTable.setConfig({"rowAlternate": enable});
		this.prsTable.setConfig({"rowAlternate": enable});
		this.flsTable.setConfig({"rowAlternate": enable});
		if (!isGuest) {
			this.advOptTable.setConfig({"rowAlternate": enable});
		}
	},

	"tableUseProgressBar": function(enable) {
		var progFunc = Function.from(enable ? TYPE_NUM_PROGRESS : TYPE_NUMBER);
		var trtProgCols = this.trtColDefs.filter(function(item) { return item[2] == TYPE_NUM_PROGRESS; }).map(function(item) { return item[0]; });
		var prsProgCols = this.prsColDefs.filter(function(item) { return item[2] == TYPE_NUM_PROGRESS; }).map(function(item) { return item[0]; });
		var flsProgCols = this.flsColDefs.filter(function(item) { return item[2] == TYPE_NUM_PROGRESS; }).map(function(item) { return item[0]; });
		this.trtTable.setConfig({"colType": trtProgCols.map(progFunc).associate(trtProgCols)});
		this.prsTable.setConfig({"colType": trtProgCols.map(progFunc).associate(prsProgCols)});
		this.flsTable.setConfig({"colType": flsProgCols.map(progFunc).associate(flsProgCols)});
	},

	"detPanelTabChange": function(id) {
		if (!(this.config || {}).showDetails) return;
		if (id === undefined) id = this.mainTabs.active;

		switch (id) {
			case "mainInfoPane-peersTab":
				this.prsTable.calcSize();
				this.prsTable.restoreScroll();

				if (this.torrentID == "") return;
			break;

			case "mainInfoPane-filesTab":
				this.flsTable.calcSize();
				this.flsTable.restoreScroll();

				if (this.torrentID == "") return;
			break;

			case "mainInfoPane-speedTab":
				this.spdGraph.draw();
			break;

			case "mainInfoPane-loggerTab":
				Logger.scrollBottom();
			break;
		}

		this.showDetails(this.torrentID);
	},

	"settingsPaneChange": function(id) {
		switch (id) {
			case "dlgSettings-TransferCap":
				this.getTransferHistory();
			break;

			case "dlgSettings-Advanced":
				this.advOptTable.calcSize();
				this.advOptTable.restoreScroll();
				this.advOptTable.resizePads();
			break;
		}

		if (this.config) {
			this.config.activeSettingsPane = id;
		}
        
        SettingsManager.changePane(id);
	},
    
    "addPlugin": function(plugin) {
        if(has(this.plugins, plugin.id))
            return;
            
        // Load
        plugin.load();
        
        this.plugins[id] = plugin;
    }
}

window.isGuest = isGuest;
window.utWebUI = utWebUI;

})(window.jQuery);
