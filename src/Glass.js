import { Stuff } from "./Stuff";
import {cm1, geo, mat} from "./common";
import {Mesh} from "three";

export class Glass extends Stuff {
  constructor(info) {
    super(info);

    this.geometry = geo.glass;
    this.material = mat.glass;

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.name = this.name;

    this.type = info.type;

    cm1.scene.add(this.mesh);
  }
}