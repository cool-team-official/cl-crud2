export default {
	name: "cl-adv-btn",
	componentName: "ClAdvBtn",
	inject: ["crud"],
	props: {
		// el-button props
		props: Object
	},
	render() {
		return (
			<div class="cl-adv-btn">
				<el-button
					{...{
						props: {
							size: "mini",
							...this.props
						},
						on: {
							click: this.crud.openAdvSearch
						}
					}}>
					<i class="el-icon-search" />
					{this.$slots.default || this.crud.dict.label.advSearch}
				</el-button>
			</div>
		);
	}
};
