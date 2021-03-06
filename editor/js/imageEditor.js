docLayer.modules.define("imageEditor", {
	sliders: {
		blur: $("#image-blur"),
		brightness: $("#image-brightness"),
		contrast: $("#image-contrast"),
		grayscale: $("#image-grayscale"),
		saturation: $("#image-saturation"),
		opacity: $("#image-opacity"),
		invert: $("#image-invert"),
	},
	imageDialog: $(".image-edit-dialog"),
	previewPane: $("#image-editor-preview"),
	renderImage: function (options, el) {
		var filter = "blur(" + options.blur + "px) brightness(" + options.brightness + ") contrast(" + options.contrast + "%) grayscale(" + options.grayscale + "%)  saturate(" + options.saturation + "%) opacity(" + options.opacity + "%) invert(" + options.invert + "%)"
		el.css("filter", filter);
		el.css("-webkit-filter", filter); //same thing, but for webkit

		el.attr("data-blur", options.blur);
		el.attr("data-brightness", options.brightness);
		el.attr("data-contrast", options.contrast);
		el.attr("data-grayscale", options.grayscale);
		el.attr("data-saturation", options.saturation);
		el.attr("data-opacity", options.opacity);
		el.attr("data-invert", options.invert);
	},
	resetSliders: function () {
		this.sliders.blur[0].value = 0;
		this.sliders.brightness[0].value = 1;
		this.sliders.contrast[0].value = 100;
		this.sliders.grayscale[0].value = 0;
		this.sliders.saturation[0].value = 100;
		this.sliders.opacity[0].value = 100;
		this.sliders.invert[0].value = 0;
		this.updatePreview();
	},
	editImage: function (item) {
		this.selectedItem = item;
		docLayer.ui.dialogs.show(this.imageDialog);
	},
	startImageEditing: function () {
		var editTarget = this.selectedItem;
		this.sliders.blur[0].value = editTarget.attr("data-blur");
		this.sliders.brightness[0].value = editTarget.attr("data-brightness");
		this.sliders.contrast[0].value = editTarget.attr("data-contrast");
		this.sliders.grayscale[0].value = editTarget.attr("data-grayscale");
		this.sliders.saturation[0].value = editTarget.attr("data-saturation");
		this.sliders.opacity[0].value = editTarget.attr("data-opacity");
		this.sliders.invert[0].value = editTarget.attr("data-invert");
		this.previewPane.attr("src", editTarget.attr("src"));
		this.updatePreview();
	},
	saveImageEdits: function () {
		var editTarget = this.selectedItem;
		this.selectedItem = null;
		this.renderImage({
			brightness: this.sliders.brightness.val(),
			contrast: this.sliders.contrast.val(),
			blur: this.sliders.blur.val(),
			grayscale: this.sliders.grayscale.val(),
			saturation: this.sliders.saturation.val(),
			opacity: this.sliders.opacity.val(),
			invert: this.sliders.invert.val(),
		}, editTarget);
		docLayer.ui.dialogs.hide(this.imageDialog);
	},
	updatePreview: function () {
		this.renderImage({
			brightness: this.sliders.brightness.val(),
			contrast: this.sliders.contrast.val(),
			blur: this.sliders.blur.val(),
			grayscale: this.sliders.grayscale.val(),
			saturation: this.sliders.saturation.val(),
			opacity: this.sliders.opacity.val(),
			invert: this.sliders.invert.val(),
		}, this.previewPane);
	},
	cancelImageEdit: function () {
		this.selectedItem = null;
	},
	showEditButton: function (item) {
		var _ = this;
		var button = this.editButton;
		var offset = item.offset();
		var itemwidth = item.width();
		button.css({
			top: offset.top,
			left: offset.left + itemwidth
		});
		button.show();
		button.off();
		button.on("click", function () {
			_.editImage(item);
			button.hide();
		});
	},
	init: function () {
		var _ = this;
		this.resetSliders = this.resetSliders.bind(this);
		this.editImage = this.editImage.bind(this);
		this.startImageEditing = this.startImageEditing.bind(this);
		this.saveImageEdits = this.saveImageEdits.bind(this);
		this.showEditButton = this.showEditButton.bind(this);
		this.updatePreview = this.updatePreview.bind(this);
		$(document.body).append('<div noprint class="image-edit-button edit-button small fab color-green-500" title="Edit"><i class="icon-create"></i></div>'); //add the deletion button
		this.editButton = $(".image-edit-button");
		docLayer.editregion.on("mouseover", ".extend-block.image-extend-block", function () {
			_.showEditButton($(this));
		});
		this.imageDialog.on("dialog-shown", this.startImageEditing);
		this.imageDialog.on("dialog-cancel", this.cancelImageEdit);
		this.imageDialog.on("dialog-confirm", this.saveImageEdits);

		$("#sliders-reset").on("click", function () {
			_.resetSliders();
		});
		$(".image-edit-dialog .controls input").on("change", function () {
			_.updatePreview();
		});
	}
});