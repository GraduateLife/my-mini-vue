export function initProps(instance, rawProps) {
	rawProps ? (instance.props = rawProps) : {}; //考虑到一个组件可能没有prop(至少根组件一定没有)，所以要做好保底
}
