import { renderNode } from "@/utils/vnode";
import { isBoolean, throttle } from "@/utils";

export default {
	name: "cl-dialog",
	componentName: "ClDialog",
	props: {
		visible: Boolean,
		title: {
			type: String,
			default: "对话框"
		},
		drag: {
			type: Boolean,
			default: true
		},
		props: {
			type: Object,
			default: () => {
				return {};
			}
		},
		on: {
			type: Object,
			default: () => {
				return {};
			}
		},
		opList: {
			type: Array,
			default: () => ["fullscreen", "close"]
		}
	},

	watch: {
		"props.fullscreen"(f) {
			if (this.$el && this.$el.querySelector) {
				const el = this.$el.querySelector(".el-dialog");

				if (el) {
					if (f) {
						el.style = {
							top: 0,
							left: 0
						};
					} else {
						el.style.marginBottom = "50px";
					}

					// Set header cursor state
					el.querySelector(".el-dialog__header").style.cursor = f ? "text" : "move";
				}
			}

			if (this.crud) {
				// Fullscreen change event
				this.crud.$emit("fullscreen-change");
			}
		},
		visible: {
			immediate: true,
			handler(f) {
				if (f) {
					this.dragEvent();
				}
			}
		}
	},

	methods: {
		open() {
			this.$emit("update:visible", true);
			this.$emit("open");
		},

		// Avoid double close event
		close: throttle(function () {
			this.$emit("update:visible", false);
			this.$emit("close");

			setTimeout(() => {
				this.changeFullscreen(false);
			}, 300);
		}, 10),

		changeFullscreen(f) {
			this.$set(this.props, "fullscreen", isBoolean(f) ? f : !this.props.fullscreen);
			this.$emit("update:props:fullscreen", this.props.fullscreen);
		},

		dragEvent() {
			this.$nextTick(() => {
				const dlg = this.$el.querySelector(".el-dialog");
				const hdr = this.$el.querySelector(".el-dialog__header");

				if (!hdr) {
					return false;
				}

				hdr.onmousedown = (e) => {
					// Props
					const { fullscreen, top = "15vh" } = this.props;

					// Body size
					const { clientWidth, clientHeight } = document.body;

					// Try drag
					const isDrag = (() => {
						if (fullscreen) {
							return false;
						}

						if (!this.drag) {
							return false;
						}

						// Determine height of the box is too large
						let marginTop = 0;

						if (["vh", "%"].some((e) => top.includes(e))) {
							marginTop = clientHeight * (parseInt(top) / 100);
						}

						if (top.includes("px")) {
							marginTop = top;
						}

						if (dlg.clientHeight > clientHeight - 50 - marginTop) {
							return false;
						}

						return true;
					})();

					// Set header cursor state
					if (!isDrag) {
						return (hdr.style.cursor = "text");
					} else {
						hdr.style.cursor = "move";
					}

					// Set el-dialog style, hidden scroller
					dlg.style.marginTop = 0;
					dlg.style.marginBottom = 0;
					dlg.style.top = dlg.style.top || top;

					// Distance
					const dis = {
						left: e.clientX - hdr.offsetLeft,
						top: e.clientY - hdr.offsetTop
					};

					// Calc left and top of the box
					const box = (() => {
						const { left, top } =
							dlg.currentStyle || window.getComputedStyle(dlg, null);

						if (left.includes("%")) {
							return {
								top: +clientHeight * (+top.replace(/\%/g, "") / 100),
								left: +clientWidth * (+left.replace(/\%/g, "") / 100)
							};
						} else {
							return {
								top: +top.replace(/\px/g, ""),
								left: +left.replace(/\px/g, "")
							};
						}
					})();

					// Screen limit
					const pad = 5;
					const minLeft = -(clientWidth - dlg.clientWidth) / 2 + pad;
					const maxLeft =
						(dlg.clientWidth >= clientWidth / 2
							? dlg.clientWidth / 2 - (dlg.clientWidth - clientWidth / 2)
							: dlg.clientWidth / 2 + clientWidth / 2 - dlg.clientWidth) - pad;

					const minTop = pad;
					const maxTop = clientHeight - dlg.clientHeight - pad;

					// Start move
					document.onmousemove = function (e) {
						let left = e.clientX - dis.left + box.left;
						let top = e.clientY - dis.top + box.top;

						if (left < minLeft) {
							left = minLeft;
						} else if (left >= maxLeft) {
							left = maxLeft;
						}

						if (top < minTop) {
							top = minTop;
						} else if (top >= maxTop) {
							top = maxTop;
						}

						// Set dialog top and left
						dlg.style.top = top + "px";
						dlg.style.left = left + "px";
					};

					// Clear event
					document.onmouseup = function () {
						document.onmousemove = null;
						document.onmouseup = null;
					};
				};
			});
		},

		headerRender() {
			return (
				<div
					class="cl-dialog__header"
					{...{
						on: {
							dblclick: () => {
								this.changeFullscreen();
							}
						}
					}}>
					{/* title */}
					<span class="cl-dialog__title">{this.title}</span>
					{/* op button */}
					<div class="cl-dialog__headerbtn">
						{this.opList.map((vnode) => {
							if (vnode === "fullscreen") {
								return this.props.fullscreen ? (
									<button class="minimize" on-click={this.changeFullscreen}>
										<i class="el-icon-minus" />
									</button>
								) : (
									<button class="maximize" on-click={this.changeFullscreen}>
										<i class="el-icon-full-screen" />
									</button>
								);
							} else if (vnode === "close") {
								return (
									<button class="close" on-click={this.close}>
										<i class="el-icon-close" />
									</button>
								);
							} else {
								return renderNode(vnode, {
									$scopedSlots: this.$scopedSlots
								});
							}
						})}
					</div>
				</div>
			);
		},

		slotsRender() {
			const { default: body = [], footer = [] } = this.$slots || {};

			return {
				body: body[0],
				footer: footer[0]
			};
		}
	},

	render() {
		const { body, footer } = this.slotsRender();

		return (
			this.visible && (
				<el-dialog
					custom-class="cl-dialog"
					{...{
						props: {
							...this.props,
							visible: this.visible,
							"show-close": false
						},
						on: {
							...this.on,
							open: this.open,
							close: this.close
						}
					}}>
					<template slot="title">{this.headerRender()}</template>
					{body}
					<template slot="footer">{footer}</template>
				</el-dialog>
			)
		);
	}
};
