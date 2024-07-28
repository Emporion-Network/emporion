/** @type {import('svelte/action').Action}  */
export function fancyBorder(node:HTMLElement) {
    const handleMove = (e:MouseEvent)=>{
        let t = e.currentTarget as HTMLElement;
        let r = t.getBoundingClientRect();
        let x = e.clientX - r.left; //x position within the element.
        let y = (e.clientY - r.top);
        x = (x/r.width)*100;
        y = (y/r.height)*100;

        let size = r.height/r.width;
        
        t.style.setProperty('--border-pos', `${x}% ${y}%`);
        t.style.setProperty('--border-size', `${size*120}%`);
    }
    let t = node as HTMLElement;
    let r = t.getBoundingClientRect();
    let size = r.height/r.width;
    t.style.setProperty('--border-size', `${size*120}%`);
    t.style.setProperty('--border-pos', `${50}% ${0}%`);

    const handleLeave = (e:MouseEvent) =>{
        let t = node as HTMLElement;
        let r = t.getBoundingClientRect();
        let size = r.height/r.width;
        t.style.setProperty('--border-size', `${size*120}%`);
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