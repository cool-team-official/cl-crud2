import { dataset } from "@/utils";

export default {
	inject({ form, scope = "" }) {
		const set = ({ prop, options, hidden, path }, data) => {
			let p = path;

			if (prop) {
				p = `${scope}items[prop:${prop}]`;
			}

			if (options) {
				p += `.component.options`;
			}

			if (hidden) {
				p += ".hidden";
			}

			return dataset(this, p, data);
		};

		// Component scoped
		let _this = this;

		Object.assign(this, {
			// Get form
			getForm(prop) {
				return prop ? form[prop] : form;
			},

			// Set form
			setForm(prop, value) {
				// Add watch
				_this.$set(form, prop, value);
			},

			// Set [props, on]
			setData(path, value) {
				set({ path }, value);
			},

			// Set item component options
			setOptions(prop, value) {
				set({ options: true, prop }, value);
			},

			// Toggle item is hide or show
			toggleItem(prop, value) {
				if (value === undefined) {
					value = set({ prop, hidden: true });
				}

				set({ hidden: true, prop }, !value);
			},

			// Hidden item
			hiddenItem(...props) {
				props.forEach((prop) => {
					set({ hidden: true, prop }, true);
				});
			},

			// Show item
			showItem(...props) {
				props.forEach((prop) => {
					set({ hidden: true, prop }, false);
				});
			},

			// Clear form data
			clearForm() {
				for (let i in form) {
					delete form[i]
				}
			}
		});
	}
};
