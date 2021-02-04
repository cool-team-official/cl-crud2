import { dataset } from "@/utils";

export default {
	methods: {
		_set({ prop, options, hidden, path }, data) {
			let conf = null

			switch (this.$options._componentTag) {
				case 'cl-adv-search':
					conf = this
					break
				case 'cl-form':
					conf = this.conf
					break
			}

			let p = path;

			if (prop) {
				p = `items[prop:${prop}]`;
			}

			if (options) {
				p += `.component.options`;
			}

			if (hidden) {
				p += ".hidden";
			}

			return dataset(conf, p, data);
		},

		// Get form
		getForm(prop) {
			return prop ? this.form[prop] : this.form;
		},

		// Set form
		setForm(prop, value) {
			// Add watch
			this.$set(this.form, prop, value);
		},

		// Set [props, on]
		setData(path, value) {
			this._set({ path }, value);
		},

		// Set item component options
		setOptions(prop, value) {
			this._set({ options: true, prop }, value);
		},

		// Toggle item is hide or show
		toggleItem(prop, value) {
			if (value === undefined) {
				value = this._set({ prop, hidden: true });
			}

			this._set({ hidden: true, prop }, !value);
		},

		// Hidden item
		hiddenItem(...props) {
			props.forEach((prop) => {
				this._set({ hidden: true, prop }, true);
			});
		},

		// Show item
		showItem(...props) {
			props.forEach((prop) => {
				this._set({ hidden: true, prop }, false);
			});
		},

		// Clear form data
		clearForm() {
			this.$refs["form"].clearValidate();
		},

		// Reset form data
		resetForm() {
			this.$refs['form'].resetFields()
		}
	}
};
