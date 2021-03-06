/********** Infocards.js by Tim Nguyen ***********/
/****** http://github.com/nt1m/InfoCards.js ******/
function InfoCard(options) {
	var _ = this;
	if(!options || !options.query) {
		throw new SyntaxError("[InfoCard] Missing query parameter");
		return;
	}
	if(!options.container) {
		throw new SyntaxError("[InfoCard] Missing container parameter");
		return;
	}
	this.container = options.container;
	this.options = options;
	this.query = options.query;
	this.apiURL = (options.hasOwnProperty("protocol") ? options.protocol : "http") + "://api.duckduckgo.com/?q=" + encodeURIComponent(this.query) + "&format=json";
	if(options.appReferName) {
		this.apiURL += "&t=" + options.appReferName;
	}
	this.getJSONData = function(callback, error) {
		var url = this.apiURL;
		var callbackName = "jsonp_callback_" + Math.round(100000 * Math.random());
		window[callbackName] = function(data) {
			delete window[callbackName];
			document.body.removeChild(script);
			callback(data);
		};

		var script = document.createElement("script");
		script.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + "callback=" + callbackName;
		document.body.appendChild(script);

		script.onerror = function() {
			error();
		}
	}
	this.hasTabs = false;
	this.onEmptyCallback = function() {
		if(options.hasOwnProperty("onEmpty")) {
			options.onEmpty(_.container);
		}
	}
	this.applyDomOptions = function(name, element) {
		if(!options.hasOwnProperty("classNames")) {
			return;
		}
		if(options.classNames.hasOwnProperty(name)) {
			element.classList.add(options.classNames[name]);
		}
	}
	this.parseTopic = function(data, container) {
		if(data.hasOwnProperty("Topics")) {
			return;
		}
		var item = document.createElement("li");
		_.applyDomOptions("category-item", item);
		container.appendChild(item);

		var title = document.createElement("h2");
		title.innerHTML = decodeURIComponent(data.FirstURL.replace("https://duckduckgo.com/","")
		                                                  .replace(/_/g," "));
		item.appendChild(title);
		if(options.onHeadingClick) {
			title.onclick = options.onHeadingClick;
		}
		if(data.hasOwnProperty("Icon") && data.Icon.URL != "") {
			var image = document.createElement("img");
			image.src = data.Icon.URL;
			item.appendChild(image);
		}
		var description = document.createElement("p");
		description.innerHTML = data.Result;
		item.appendChild(description);

		var unwantedlink = description.querySelector("a");
		description.removeChild(unwantedlink);
	}
	this.matchesSelector = function(element, selector) {
		var matches = element.matches || element.webkitMatchesSelector || element.mozMatchesSelector || element.msMatchesSelector;
		return matches.call(element, selector);
	}
	this.enableHorizontalScrolling = function(element) {
		if(!options.horizontalScrolling || 
		  ((typeof options.horizontalScrolling == "string") && 
		   !this.matchesSelector(element, options.horizontalScrolling))) {
			return;
		}
		element.addEventListener("wheel", function(event) {
			element.scrollLeft += (event.deltaY * 5);
			event.preventDefault();
		});
	}
	this.createCard = function() {
		_.getJSONData(function(data) {
			_.container.classList.add("InfoCard-container");

			if(data.Type !== "E" && (data.Heading == "" || data.Type == "")) {
				_.onEmptyCallback();
				return;
			}
			_.card = document.createElement("div");
			_.container.appendChild(_.card);
			_.card.classList.add("InfoCard-card");
			_.applyDomOptions("card", _.card);

			var infos = document.createElement("div");
			infos.classList.add("InfoCard-text");
			_.card.appendChild(infos);

			var header = document.createElement("h1");
			infos.appendChild(header);
			header.classList.add("InfoCard-title");
			header.textContent = data.Heading;
			if(options.onHeadingClick) {
				header.onclick = options.onHeadingClick;
			}

			_.card.classList.add("InfoCard-type-"+data.Type.toLowerCase());

			switch(data.Type) {
				case "A":
					if(data.Image || data.Image != "") {
						var imagecont = document.createElement("div");
						imagecont.classList.add("InfoCard-image-container");
						_.card.insertBefore(imagecont, infos);
						var image = document.createElement("img");
						image.classList.add("InfoCard-image");
						image.src = data.Image;
						image.style.width = data.ImageWidth;
						image.style.height = data.ImageHeight;
						imagecont.appendChild(image);
					}
					if(data.Entity) {
						var entity = document.createElement("p");
						entity.classList.add("InfoCard-entity");
						entity.innerHTML = data.Entity;
						infos.appendChild(entity);
					}
					var description = document.createElement("p");
					description.innerHTML = data.Abstract;
					description.classList.add("InfoCard-description");
					infos.appendChild(description);

					if(data.hasOwnProperty("Results") && data.Results.length > 0) {
						var links = document.createElement("div");
						links.classList.add("InfoCard-links");
						infos.appendChild(links);
						data.Results.forEach(function(value) {
							var link = document.createElement("a");
							link.href = value.FirstURL;
							links.appendChild(link);
							var icon = document.createElement("img");
							icon.src = value.Icon.URL;
							icon.classList.add("InfoCard-link-icon");
							link.appendChild(icon);
							var linklabel = document.createElement("span");
							linklabel.innerHTML = value.Text;
							link.appendChild(linklabel);
						});
					}

					if((data.Infobox || data.Infobox != "") &&
						data.Infobox.hasOwnProperty("content")) {
						var details = document.createElement("ul");
						details.classList.add("InfoCard-list");
						_.card.appendChild(details);
						data.Infobox.content.forEach(function(value) {
							var item = document.createElement("li");
							details.appendChild(item);
							var labelDOM = document.createElement("label");
							labelDOM.innerHTML = value.label;
							item.appendChild(labelDOM);
							var valueDOM = document.createElement("span");
							valueDOM.innerHTML = value["value"];
							item.appendChild(valueDOM);
						});
					}


				break;
				case "D":
					if(!data.hasOwnProperty("RelatedTopics") && data.RelatedTopics == "") {
						_.onEmptyCallback();
						return;
					}
					_.hasTabs = true;
					var tabs = document.createElement("ul");
					tabs.classList.add("InfoCard-tabs");
					_.applyDomOptions("tabs", tabs);
					infos.appendChild(tabs);
					_.enableHorizontalScrolling(tabs);

					var toptab = document.createElement("li");
					toptab.innerHTML = "Top";
					toptab.dataset.id = "top";
					tabs.appendChild(toptab);

					var categorycard = document.createElement("ul");
					categorycard.className = "InfoCard-category InfoCard-tab-content";
					categorycard.dataset.id = "top";
					infos.appendChild(categorycard);
					_.enableHorizontalScrolling(categorycard);

					data.RelatedTopics.forEach(function(value) {
						if(value.hasOwnProperty("Topics")) {
							var tab = document.createElement("li");
							tab.innerHTML = value.Name;
							tab.dataset.id = value.Name;
							tabs.appendChild(tab);

							var tabcount = document.createElement("sup");
							tabcount.innerHTML = value.Topics.length;
							tab.appendChild(tabcount);

							var tabcontent = document.createElement("ul");
							tabcontent.className = "InfoCard-category InfoCard-tab-content";
							tabcontent.dataset.id = value.Name;
							infos.appendChild(tabcontent);
							_.enableHorizontalScrolling(tabcontent);

							value.Topics.forEach(function(val) {
								_.parseTopic(val, tabcontent)
							});
						}
						else {
							_.parseTopic(value, categorycard);
						}
					});
					var toptabcount = document.createElement("sup");
					toptabcount.innerHTML = categorycard.querySelectorAll("li").length;
					toptab.appendChild(toptabcount);
				break;
				case "C":
					if(!data.hasOwnProperty("RelatedTopics") && data.RelatedTopics == "") {
						_.onEmptyCallback();
						return;
					}
					var categorycard = document.createElement("ul");
					categorycard.className = "InfoCard-category";
					infos.appendChild(categorycard);
					_.enableHorizontalScrolling(categorycard);
					data.RelatedTopics.forEach(function(value) {
						_.parseTopic(value, categorycard);	
					});
				break;
				case "E":
					if(data.Answer == "") {
						_.onEmptyCallback();
						return;
					}
					var answer = document.createElement("p");
					if (typeof data.Answer == "string") {
						answer.innerHTML = data.Answer;
						infos.appendChild(answer);
						answer.dataset.type = data.AnswerType;
						answer.className = "InfoCard-exclusive-answer";
					}
					else {
						header.textContent = data.Answer.data.title;

						var entity = document.createElement("p");
						entity.classList.add("InfoCard-entity");
						entity.innerHTML = data.Answer.data.subtitle;
						infos.appendChild(entity);

						var description = document.createElement("p");
						description.innerHTML = data.Answer.data.description;
						description.classList.add("InfoCard-description");
						infos.appendChild(description);
						if (data.Answer.data.image) {
							var img = document.createElement("img");
							img.src = data.Answer.data.image;
							img.className = "InfoCard-image";
							_.card.insertBefore(img, infos);
						}
						if (data.Answer.meta) {
							var links = document.createElement("div");
							links.classList.add("InfoCard-links");
							infos.appendChild(links);

							var sourcelink = document.createElement("a");
							sourcelink.href = data.Answer.meta.sourceUrl;
							sourcelink.textContent = data.Answer.meta.sourceName;
							links.appendChild(sourcelink);
						}
					}
					switch(data.AnswerType) {
						case "calc":
							header.textContent = options.query;
							var invisibleEl = document.createElement("p");
							invisibleEl.innerHTML = data.Answer;
							answer.textContent = invisibleEl.textContent;
						break;
						case "color_code":
							answer.querySelector(".colorcodesbox").className = "InfoCard-color-display";
							answer.innerHTML = answer.innerHTML.replace(/hsl\(/g, " · hsl(");
							answer.innerHTML = answer.innerHTML.replace(/ \· /g, "<br/>").replace("] [", " · ").replace("]", "").replace("[", "");
							answer.querySelector(".column1").className = "InfoCard-column";
							answer.querySelector(".column2").className = "InfoCard-column";
						break;
						default:
							var invisibleEl = document.createElement("p");
							invisibleEl.innerHTML = data.Answer;
							answer.textContent = invisibleEl.textContent;
						break;
					}

				break;
				case "N":
					options.onError(1);
					return;
				break;
				default:
					options.onError(1);
					return;
				break;
			}
			var creditlink = document.createElement("a");
			creditlink.className = "InfoCard-credit-link";
			creditlink.innerHTML = "Results by DuckDuckGo";
			creditlink.href = "http://duckduckgo.com/?q=" + encodeURIComponent(_.query);
			_.card.appendChild(creditlink);
			if(options.appReferName) {
				creditlink.href += "&t=" + options.appReferName;
			}
			if(_.hasTabs) {
				_.initTabs();
			}
			if(options.onLoad) {
				options.onLoad(_.card);
			}
		}, function() {
			options.onError(0)
		});
	}
	this.initTabs = function() {
		var tabcontent = _.container.querySelectorAll(".InfoCard-tab-content");
		var tabs = _.container.querySelectorAll(".InfoCard-tabs > li");

		for (var i = 0, len = tabcontent.length; i < len; i++) {
			tabcontent[i].style.display = "none";
		}
		_.container.querySelector(".InfoCard-tab-content[data-id='top']").style.display = "block";
		_.container.querySelector(".InfoCard-tabs > li[data-id='top']").classList.add("InfoCard-selected");

		for (var i = 0, len = tabs.length; i < len; i++) {
			tabs[i].addEventListener("click", function() {
				for (var i = 0, len = tabs.length; i < len; i++) {
					tabs[i].classList.remove("InfoCard-selected");
				}
				this.classList.add("InfoCard-selected");
				for (var i = 0, len = tabcontent.length; i < len; i++) {
					tabcontent[i].style.display = "none";
				}
				_.container.querySelector(".InfoCard-tab-content[data-id='"+this.dataset.id+"']").style.display = "block";
			}, false);
		}
	}
	this.destroy = function() {
		_.container.innerHTML = "";
	}
	this.createCard();
}
