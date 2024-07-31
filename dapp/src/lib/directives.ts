/** @type {import('svelte/action').Action}  */
export function fancyBorder(node: HTMLElement) {
    const handleMove = (e: MouseEvent) => {
        let t = e.currentTarget as HTMLElement;
        let r = t.getBoundingClientRect();
        let x = e.clientX - r.left; //x position within the element.
        let y = (e.clientY - r.top);
        x = (x / r.width) * 100;
        y = (y / r.height) * 100;

        let size = r.height / r.width;

        t.style.setProperty('--border-pos', `${x}% ${y}%`);
        t.style.setProperty('--border-size', `${size * 120}%`);
    }
    let t = node as HTMLElement;
    let r = t.getBoundingClientRect();
    let size = r.height / r.width;
    t.style.setProperty('--border-size', `${size * 120}%`);
    t.style.setProperty('--border-pos', `${50}% ${0}%`);

    const handleLeave = (e: MouseEvent) => {
        let t = node as HTMLElement;
        let r = t.getBoundingClientRect();
        let size = r.height / r.width;
        t.style.setProperty('--border-size', `${size * 120}%`);
        t.style.setProperty('--border-pos', `${50}% ${0}%`);
    }
    node.addEventListener('mousemove', handleMove);
    node.addEventListener('mouseleave', handleLeave);

    return {
        destroy() {
            // the node has been removed from the DOM
            node.removeEventListener('mousemove', handleMove);
        }
    };
}

/** @type {import('svelte/action').Action}  */
export function clickOutside(node: HTMLElement, callback: () => void = () => { }) {
    node.setAttribute('tabindex', '-1');
    node.focus()
    const evt = () => {
        setTimeout(() => {
            if (document.activeElement !== node && !node.contains(document.activeElement)) {
                callback()
            }
        }, 10)
    }
    document.addEventListener('focusout', evt)

    return {
        destroy() {
            // the node has been removed from the DOM
            document.removeEventListener('focusout', evt);
        }
    };

}

const getAllfocusables = (parent:HTMLElement) => {
    return Array.from(parent.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), details:not([disabled]), summary:not(:disabled)'
      )) as HTMLElement[];
}


/** @type {import('svelte/action').Action}  */
export function trapFocus(node: HTMLElement) {
    node.setAttribute('tabindex', '-1');
    node.focus()
    let last:HTMLElement;
    const evt = (e:FocusEvent) => {
        let n = e.relatedTarget as HTMLElement;
        if(n !== node && !node.contains(n)) {
            const focusables = getAllfocusables(node);
            if(focusables[0] === last){
                n = focusables[focusables.length - 1];
                n.focus()
            } else if(focusables[0]) {
                n = focusables[0]
                n.focus();
            } else {
                node.focus()
            }
        }
        last = n;
    }
    document.addEventListener('focusout', evt)

    return {
        destroy() {
            // the node has been removed from the DOM
            document.removeEventListener('focusout', evt);
        }
    };

}