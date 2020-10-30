export default {
	name: "cl-multi-delete-btn",
	componentName: "ClMultiDeleteBtn",
	inject: ["crud"],
	props: {
		// el-button props
		props: Object
	},
	render() {
		return (
			this.crud.getPermission("delete") && (
				<el-button
					{...{
						props: {
							size: "mini",
							type: "danger",
							disabled: this.crud.selection.length == 0,
							...this.props
						},
						on: {
							click: this.crud.deleteMulti
						}
					}}>
					{this.$slots.default || "删除"}
				</el-button>
			)
		);
	}
};
