export class AnimationMgr {
    static play(element, animation_class_name) {
        if (!element) return;
        element.offsetWidth;
        element.classList.add(animation_class_name);
    }
    static stop(element, animation_class_name) {
        if (!element) return;
        element.classList.remove(animation_class_name);
        element.offsetWidth;
    }
}