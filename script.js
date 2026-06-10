const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const energyBar = document.getElementById("energyBar");
const progressBar = document.getElementById("progressBar");

const CONFIG = {
    gravity: 0.6,
    groundY: 460
};

const keys = {};
document.addEventListener("keydown",e=>keys[e.code]=true);
document.addEventListener("keyup",e=>keys[e.code]=false);

function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

function AABB(a,b){
return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
}

function dist(a,b){
return Math.hypot(a.x-b.x,a.y-b.y);
}

////////////////////////////////////////////////////
// PLAYER
////////////////////////////////////////////////////
class Player{
constructor(){
this.x=100;
this.y=300;
this.w=30;
this.h=40;
this.vx=0;
this.vy=0;
this.energy=30;
this.onGround=false;
}

update(){

this.vx=0;

if(keys["ArrowRight"]) this.vx=4;
if(keys["ArrowLeft"]) this.vx=-4;

if(keys["Space"] && this.onGround){
this.vy=-12;
this.onGround=false;
}

this.vy+=CONFIG.gravity;

this.x+=this.vx;
this.y+=this.vy;

if(this.y+this.h>=CONFIG.groundY){
this.y=CONFIG.groundY-this.h;
this.vy=0;
this.onGround=true;
}

this.x=clamp(this.x,0,960-this.w);
}

draw(){
ctx.fillStyle="#22c55e";
ctx.fillRect(this.x,this.y,this.w,this.h);
}
}

////////////////////////////////////////////////////
// WASTE
////////////////////////////////////////////////////
class Waste{
constructor(x){
this.x=x;
this.y=CONFIG.groundY-20;
this.w=16;
this.h=16;
this.active=true;
}

draw(){
if(!this.active)return;
ctx.fillStyle="#0288d1";
ctx.fillRect(this.x,this.y,this.w,this.h);
}
}

////////////////////////////////////////////////////
// ENEMY (FSM simples)
////////////////////////////////////////////////////
class Enemy{
constructor(x){
this.x=x;
this.y=CONFIG.groundY-30;
this.w=28;
this.h=28;
this.vx=1.5;
this.state="PATROL";
this.range=[x-80,x+80];
this.active=true;
}

update(){

if(!this.active)return;

// FSM
if(dist(this,player)<120)this.state="CHASE";
else this.state="PATROL";

if(this.state==="PATROL"){
this.x+=this.vx;
if(this.x<this.range[0]||this.x>this.range[1])this.vx*=-1;
}

if(this.state==="CHASE"){
this.x += (player.x<this.x?-2:2);
}

if(AABB(this,player)){
player.energy-=0.3;
}
}

draw(){
ctx.fillStyle=this.state==="CHASE"?"#ef4444":"#8e24aa";
ctx.fillRect(this.x,this.y,this.w,this.h);
}
}

////////////////////////////////////////////////////
// TRAP
////////////////////////////////////////////////////
class Trap{
constructor(x,y){
this.x=x;
this.y=y;
this.r=60;
this.life=200;
}

update(){
this.life--;

for(let e of enemies){
if(e.active && dist(this,e)<this.r){
e.vx=0;
}
}
}

draw(){
ctx.globalAlpha=0.25;
ctx.fillStyle="#22c55e";
ctx.beginPath();
ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
ctx.fill();
ctx.globalAlpha=1;
}
}

////////////////////////////////////////////////////
// GAME STATE
////////////////////////////////////////////////////
const player=new Player();

const enemies=[
new Enemy(400),
new Enemy(700)
];

const wastes=[
new Waste(300),
new Waste(500),
new Waste(650)
];

const traps=[];

let progress=15;

////////////////////////////////////////////////////
// INPUT TRAP
////////////////////////////////////////////////////
document.addEventListener("keydown",e=>{
if(e.code==="KeyF" && player.energy>=20){
player.energy-=20;
traps.push(new Trap(player.x,player.y));
}
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
function update(){

player.update();

for(let e of enemies)e.update();

for(let t of traps)t.update();

// coleta
for(let w of wastes){
if(w.active && AABB(player,w)){
w.active=false;
player.energy=Math.min(100,player.energy+20);
progress+=10;
}
}

// UI
energyBar.style.width=player.energy+"%";
progressBar.style.width=progress+"%";
}

////////////////////////////////////////////////////
// DRAW
////////////////////////////////////////////////////
function draw(){

ctx.clearRect(0,0,960,540);

// chão
ctx.fillStyle="#16a34a";
ctx.fillRect(0,CONFIG.groundY,960,80);

// wastes
for(let w of wastes)w.draw();

// traps
for(let t of traps)t.draw();

// enemies
for(let e of enemies)e.draw();

// player
player.draw();

// win
if(progress>=100){
ctx.fillStyle="gold";
ctx.font="40px monospace";
ctx.fillText("PLANETA LIMPO!",300,250);
}
}

////////////////////////////////////////////////////
// LOOP
////////////////////////////////////////////////////
function loop(){
update();
draw();
requestAnimationFrame(loop);
}

loop();
