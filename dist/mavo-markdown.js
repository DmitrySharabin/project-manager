(function($, $$) {

const SELECTOR = ".markdown, [mv-markdown-options]";

Mavo.Plugins.register("markdown", {
	ready: Promise.all([
		$.include(self.showdown, "https://cdnjs.cloudflare.com/ajax/libs/showdown/1.8.2/showdown.min.js"),
		$.include(self.DOMPurify, "https://cdnjs.cloudflare.com/ajax/libs/dompurify/1.0.2/purify.min.js")
	]),
	init: function() {
		showdown.setFlavor("github");
		self.Showdown = new showdown.Converter();
	},
	hooks: {
		"init-start": function() {
			// Disable expressions on Markdown properties, before expressions are parsed
			for (var element of $$(SELECTOR, this.element)) {
				if (element.matches(Mavo.selectors.primitive)) {
					element.setAttribute("mv-expressions", element.getAttribute("mv-expressions") || "none");
				}
			}
		}
	},
	render: function(element, markdown, showdown = Showdown) {
		var env = {element, markdown};
		Mavo.hooks.run("markdown-render-before", env);

		env.rawHTML = showdown.makeHtml(env.markdown);
		env.html = DOMPurify.sanitize(env.rawHTML);
		Mavo.hooks.run("markdown-render-after", env);

		element.innerHTML = env.html;

		requestAnimationFrame(function() {
			$.fire(element, "mv-markdown-render");
		});
	}
});

Mavo.Elements.register("markdown", {
	default: true,
	selector: SELECTOR,
	hasChildren: true,
	init: function() {
		var options = this.element.getAttribute("mv-markdown-options");

		if (options && !this.fromTemplate("showdown")) {
			this.showdown = new showdown.Converter(Mavo.options(options));
			this.showdown.setFlavor("github");
		}
	},
	editor: function() {
		var env = {context: this};
		env.editor = $.create("textarea");
		env.editor.style.whiteSpace = "pre-wrap";

		var width = this.element.offsetWidth;

		if (width) {
			env.editor.width = width;
		}

		Mavo.hooks.run("markdown-editor-create", env);

		return env.editor;
	},
	done: function() {
		// Has it actually been edited?
		this.preEdit && this.preEdit.then(function() {
			Mavo.Plugins.loaded.markdown.render(this.element, this.value, this.showdown);
		}.bind(this));
	},
	setValue: function(element, value) {
		if (this.editor) {
			this.editor.value = value;
		}
		else {
			Mavo.Plugins.loaded.markdown.render(this.element, value, this.showdown);
		}
	},
	// We don't need an observer and it actually causes problems as it tries to feed HTML changes back to MD
	observer: false
});

Mavo.Formats.Markdown = $.Class({
	extends: Mavo.Formats.Base,
	constructor: function(backend) {
		this.property = this.mavo.root.getNames("Primitive")[0];
		var primitive = this.mavo.root.children[this.property];
		primitive.config = Mavo.Elements.markdown;
	},

	static: {
		extensions: [".md", ".markdown"],
		parse: Mavo.Formats.Text.parse,
		stringify: Mavo.Formats.Text.stringify
	}
});

})(Bliss, Bliss.$);
