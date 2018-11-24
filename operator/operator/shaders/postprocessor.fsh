varying vec2 hdConformedUV;
varying vec2 uv;
uniform sampler2D inputImage;
uniform int passIndex;
uniform vec2 uRenderSize;
uniform float uTime;
uniform float exposure;

void main() {
  gl_FragColor = mix(texture2D(inputImage, uv), vec4(1, 1, 1, 1), exposure);
}
