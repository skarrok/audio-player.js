Usage

```html
<div class="audio ct-audio-player">
    <audio preload="none">
        <source src="..." type="audio/mpeg">
    </audio>
</div>

<script src="audio-player.js"></script>
<script>
    player = new CtPlayer(document.querySelector(".ct-audio-player"));
    player.initPlayer();
</script>
```

or with jquery
```js
$('.ct-audio-player').each(function() {
    player = new CtPlayer(this);
    player.initPlayer();
});
```
