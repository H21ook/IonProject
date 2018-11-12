import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Platform, ToastController } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { MusicControls } from '@ionic-native/music-controls/ngx';
import { Media, MediaObject } from '@ionic-native/media/ngx';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  public _fileList: any = [];
  public currentFile: any;
  public mediaFile: MediaObject;
  public isPlaying: boolean = false;
  public iconPP: string = 'play';

  constructor(
    private platform: Platform,
    private file: File,
    private toastController: ToastController,
    private musicControls: MusicControls,
    private media: Media) {

    if (this.platform.is('android')) {
      this.readFileList();
    }
  }
  
  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  play(file, index) {
    if (file && this.currentFile && file.path == this.currentFile.path) {
      if(this.isPlaying) {
        this.pause();
        this.isPlaying = false;
      } else {
        this.mediaFile.play();
        this.isPlaying = true;
      }
    } else {
      if(file && this.isPlaying)
        this.stop();
      
      this.mediaFile = this.media.create(file.path);
      this.currentFile = file;
      this.currentFile.currentIndex = index;

      this.musicControls.create({
        track: file.name,
        artist: 'Hishigbayar',
        cover: '../../assets/icon/favicon.png',  
        isPlaying: true,                
        dismissable: true,                   

        hasPrev: true,  
        hasNext: true,      
        hasClose: true,       
        
        ticker: 'Now playing "' + file.name + '"',
        
        playIcon: 'media_play',
        pauseIcon: 'media_pause',
        prevIcon: 'media_prev',
        nextIcon: 'media_next',
        closeIcon: 'media_close',
        notificationIcon: 'notification'
      });

      this.musicControls.subscribe().subscribe(action => {
        function events(action) {
          const message = JSON.parse(action).message;
          switch (message) {
            case 'music-controls-next':
              this.nextSong();
              break;
            case 'music-controls-previous':
              this.prevSong();
              break;
            case 'music-controls-pause':
              this.pause();
              break;
            case 'music-controls-play':
              this.mediaFile.play();
              break;
            case 'music-controls-destroy':
              this.pause();
              break;

            case 'music-controls-media-button':
              break;
            case 'music-controls-headset-unplugged':
              this.pause();
              break;
            case 'music-controls-headset-plugged':
              if(!this.isPlaying)
                this.mediaFile.play();
              break;
            default:
              break;
          }
        }

        this.musicControls.listen();
        this.musicControls.updateIsPlaying(this.isPlaying);
      });
      this.mediaFile.play();
      this.iconPP = 'pause';
      this.isPlaying = true;
    }
  }

  pause() {
    this.mediaFile.pause();
  }

  seekTo() {
    this.mediaFile.seekTo(15000);
  }

  stop() {
    this.mediaFile.stop();
  }

  nextSong(){
    this.currentFile.currentIndex == this._fileList.length - 1 ?
    this.play(this._fileList[0], 0) :
    this.play(this._fileList[this.currentFile.currentIndex + 1], this.currentFile.currentIndex + 1);
  }

  prevSong(){
    this.currentFile.currentIndex == 0 ? 
    this.play(this._fileList[this._fileList.length - 1], this._fileList.length - 1) :
    this.play(this._fileList[this.currentFile.currentIndex - 1], this.currentFile.currentIndex - 1);
  }

  onStatusUpdate() {
    this.mediaFile.onStatusUpdate.subscribe((status) => {
      this.presentToast(status.toString());
    });
  }

  async getCurrentPosition() {
    return this.mediaFile.getCurrentPosition().then(position => {
      return position;
    });
  }

  async readFileList() {
    await this.file.listDir(this.file.externalRootDirectory, '').then((result) => {
      for (let item of result) {
        if (item.isDirectory == true && item.name != '.' && item.name != '..') {
          this.getFileList(item.name);
        }
        else if (item.isFile == true && item.fullPath.substring(item.fullPath.length - 3, item.fullPath.length) == 'mp3') {
          //File found
          this._fileList.push({
            name: item.name,
            path: item.fullPath
          });
        }
      }
    },
      (error) => {
        this.presentToast(error);
      });
  }
  async getFileList(path: string) {
    await this.file.listDir(this.file.externalRootDirectory, path)
      .then((result) => {
        for (let item of result) {
          if (item.isDirectory == true && item.name != '.' && item.name != '..') {
            this.getFileList(path + '/' + item.name);
          }
          else {
            if (item.fullPath.substring(item.fullPath.length - 3, item.fullPath.length) == 'mp3') {
              this._fileList.push({
                name: item.name,
                path: item.fullPath
              });
            }
          }
        }
      }, (error) => {
        this.presentToast(error);
      })
  }

  async presentToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000
    });
    toast.present();
  }
}
