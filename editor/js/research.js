docLayer.modules.define("research", {
	html: '\
		<script async src="' + config.basepath + 'lib/InfoCards.js/js/infocards.js"></script>\
		<script async src="' + config.basepath + 'lib/wiktionary-parser/wiktionary-parser.js"></script>\
		<div noprint class="sidebar infocard-shell themeable" hidden>\
    <div class="toolbar theme-main-color">\
        <button class="icon-button panel-close" title="Close research panel"><i class="icon-close"></i></button>\
        <span class="toolbar-label">Research</span>\
    </div>\
		<div class="infocard-content"></div>\
		<div class="research-card-results"></div>\
		<div id="research-images-results"></div>\
		<a id="commons-credit-link" target="_blank" href="http://commons.wikimedia.org/wiki/Main_Page">Images from Wikimedia Commons </a>\
	</div>\
	',
	getImages: function (query) {
		var _ = this;
		$.getJSON("https://commons.wikimedia.org/w/api.php?action=query&list=allimages&format=json&continue=&callback=?", {
			"aifrom": query
		}, function (data) {
			_.imagespanel.html(""); //clear any previous results

			var resultset = data.query.allimages;

			resultset.forEach(function (result) {
				var title = result.title.replace("File:", "").replace(".JPG", "").replace(".JPEG", "").replace(".PNG", "").replace(".SVG", "").replace(".jpg", "").replace(".jpeg", "").replace(".png", "").replace(".svg", ""); //replace file endings to generate a readable title

				var box = $("<div>").addClass("image-result");
				var image = $("<img>").attr("src", result.url);
				var titlebox = $("<div>").text(title).addClass("image-title");
				image.appendTo(box);
				titlebox.appendTo(box);
				box.appendTo(_.imagespanel);
			});
		});
	},
	getMap: function (name, callback) {

		var mapSource = config.basepath + "editor/extend-maps/map.html#{place}".replace("{place}", btoa(name.replace(",", "")));

		var mapExtendBlock = $('<iframe class="extend-block map-extend-block">').attr("sandbox", "allow-scripts allow-popups").attr("src", mapSource);

		var map = $("<iframe class='research-map'>").attr("src", mapSource + ",{lat},{lon},true,true").attr("sandbox", "allow-scripts allow-popups").attr("data-addtodocument", mapExtendBlock[0].outerHTML);

		callback(map);
	},
	getDefinition: function (data) {
		var _ = this;
		if (data.indexOf(" ") == -1) { //this is a single word, so there should be a definition shown
			getDictionaryInfo(data, "English", function (results) {
				if (results.definitions.length) {
					var card = $("<div class='research-result-card dictionary-result-card'>");
					$("<h1>").text(data).appendTo(card);
					$("<h2>").text("Dictionary").appendTo(card);
					results.definitions.forEach(function (definition) {
						var p = $("<p>").addClass("research-dictionary-result").text(definition.meaning);
						$("<i>").text(definition.type).prependTo(p);
						p.appendTo(card);
					});
					$("<a class='research-credit-link' target='_blank'>View full definition</a>").attr("href", "https://en.wiktionary.org/wiki/" + data).appendTo(card);
					_.extrapanel.append(card);
				}
			});
		}
	},
	loadExtraCardData: function () {
		var _ = this;

		var card = $(".InfoCard-card");
		if (card.hasClass("InfoCard-type-a")) { //if the card is a wikipedia article
			var name = $(".InfoCard-title").text();
			var entity = $(".InfoCard-entity").text();

			console.log(name, entity);
			if (entity == "location" || entity == "country" || entity == "u.s. state") {
				_.getMap(name, function (map) {
					card.prepend(map);
				});
			}
		}
	},
	show: function (data) {
		var _ = this;
		_.panel[0].scrollTop = 0; //sometimes firefox uses a previous scroll position and scrolls down at the start, but we always want to start at the top
		$(".infocard-content").html("");

		var infocard = new InfoCard({
			query: data,
			container: $(".infocard-content")[0],
			onEmpty: function (container) {
				container.innerHTML = "<div class='secondary-text error-message'>No results found.</div>"
			},
			onError: function (container) {
				container.innerHTML = "<div class='secondary-text error-message'>An error occured</div>"
			},
			onLoad: function () {
				_.loadExtraCardData();
			},
			appReferName: "docLayer",
			onHeadingClick: function (e) {
				if (e.target.tagName == "H1") {
					window.open("https://duckduckgo.com/?q=" + encodeURIComponent(e.target.innerHTML), '_blank');
				}
			},
			horizontalScrolling: false,
			/* makes osx trackpad scrolling not work */
			classNames: {
				"category-item": "themeable",
			},
			protocol: "https"
		});
		
		docLayer.ui.sidebars.show(this.panel);
		this.extrapanel.html("");
		this.getImages(data);
		this.getDefinition(data);
	},
	itemInsertFlow: function (e) {
		var item = e.target;

		if (!docLayer.caret) {
			return;
		}
		if (item.hasAttribute("noinsert")) {
			return;
		}
		var _ = this;
		var position = $(item).offset();
		var shellposition = this.panel.offset();
		var scroll = this.panel.scrollTop();
		this.insertButton.css({
			left: position.left - shellposition.left,
			top: position.top - shellposition.top + scroll
		});
		this.insertButton.show();
		this.insertButton.off();
		this.insertButton.on("mousedown", function () {
			docLayer.caret.pasteHtmlAtCaret(($(item).attr("data-addtodocument") || ("<img class='extend-block image-extend-block' src='" + item.src + "'/>")), false);
		});
	},
	init: function () {
		var _ = this;

		this.panel = $(".infocard-shell");
		this.imagespanel = $("#research-images-results");
		this.extrapanel = $(".research-card-results");

		this.itemInsertFlow = this.itemInsertFlow.bind(this);
		this.getImages = this.getImages.bind(this);
		this.getDefinition = this.getDefinition.bind(this);
		this.loadExtraCardData = this.loadExtraCardData.bind(this);
		this.panel.append('<div noprint hidden class="research-insert-button small fab color-green-500" title="Add to document"><i class="icon-add"></i></div>');
		this.insertButton = $(".research-insert-button");

		this.panel.on("mouseover", "img, [data-addtodocument]", function (e) {
			_.itemInsertFlow(e);
		});

		$(document.body).on("click", function () {
			_.insertButton.hide();
		});
		
		//when the small cards are clicked, show a larger, more detailed card
		$(".infocard-shell").on("click", ".InfoCard-category li", function(e) {
			if($(this).find("h2")) {
				_.show($(this).find("h2").html());
			}
		});

		if (docLayer.editortooltip) {

			docLayer.editortooltip.createButton({
				name: "Research",
				content: "<i class='icon-book'></i>",
				section: "research",
				fn: function () {
					_.show(window.getSelection().toString()); //convert the selection object to a string
				},
			});

		}

		docLayer.keybindings.addBinding("mod+option+shift+i", function () {
			docLayer.research.show(window.getSelection());
		});
		docLayer.keybindings.addBinding("esc", function () {
			docLayer.ui.sidebars.hide();
		});
	}
});
