const styles: string[] = ["style-1.css", "style-2.css", "style-3.css"];

const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = `/${styles[0]}`;
document.head.appendChild(styleLink);

let styleButtonsContainer = document.getElementById('styleButtons');

if (!styleButtonsContainer) {
    styleButtonsContainer = document.createElement('div');
    styleButtonsContainer.id = 'styleButtons';
    styleButtonsContainer.style.cssText = "position: sticky; top: 0; background: #eee; padding: 10px; z-index: 9999; border-bottom: 1px solid #ccc;";
    document.body.prepend(styleButtonsContainer);
}

styles.forEach((styleFileName, index) => {
    const btn = document.createElement('button');
    btn.textContent = `Włącz Styl ${index + 1}`;
    btn.style.marginRight = "10px";
    btn.style.cursor = "pointer";

    btn.addEventListener('click', () => {
        styleLink.href = `/${styleFileName}`;
    });

    styleButtonsContainer?.appendChild(btn);
});