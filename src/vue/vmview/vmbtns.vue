<template>
    <div class="vm-btns">
        <div class="vm-user-btns">
            <template v-for="btn in userBtns">
                <button v-if="btn.show" class="btn btn-secondary" @click="btn.onclick">
                    <FontAwesomeIcon :icon="btn.icon"/> <span v-text="btn.text"></span>
                </button>
            </template>
        </div>
        <div class="vm-staff-btns">

        </div>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import CollabVMClient from '../../ts/protocol/CollabVMClient';
import { I18n } from '../../ts/i18n';
import { TurnState } from '../../ts/protocol/TurnStatus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
    props: {
        vm: {
            type: CollabVMClient,
            required: true
        },
        turnState: {
            type: Object as PropType<TurnState>,
            required: true
        }
    },
    inject: ["i18n"],
    computed: {
        TheI18n() {
            return (this.i18n as I18n);
        },
        userBtns() {
            let self = this;
            return [
                {
                    text: this.turnState === TurnState.None 
                        ? computed(() => this.TheI18n.GetString('kVMButtons_TakeTurn'))
                        : computed(() => this.TheI18n.GetString('kVMButtons_EndTurn')),
                    icon: ['fa-solid', 'fa-computer-mouse'],
                    onclick() {
                        self.vm.turn(self.turnState === TurnState.None);
                    },
                    show: true
                },
                {
                    text: computed(() => this.TheI18n.GetString('kVMButtons_Keyboard')),
                    icon: ['fa-solid', 'fa-keyboard'],
                    onclick() {

                    },
                    show: true
                },
                {
                    text: computed(() => this.TheI18n.GetString('kVMButtons_ChangeUsername')),
                    icon: ['fa-solid', 'fa-signature'],
                    onclick() {
                        let newUsername = window.prompt(self.TheI18n.GetString('kVMPrompts_EnterNewUsernamePrompt'));
                        if (newUsername) {
                            self.vm.rename(newUsername);
                        }
                    },
                    show: true
                },
                {
                    text: computed(() => this.TheI18n.GetString('kVMButtons_VoteForReset')),
                    icon: ['fa-solid', 'fa-rotate-left'],
                    onclick() {
                        self.vm.vote(true);
                    },
                    show: true
                },
                {
                    text: computed(() => this.TheI18n.GetString('kVMButtons_Screenshot')),
                    icon: ['fa-solid', 'fa-camera'],
                    onclick() {
                        self.vm.canvas.toBlob((blob) => {
                            window.open(URL.createObjectURL(blob!), '_blank');
                        });
                    },
                    show: true
                },
                {
                    text: computed(() => this.TheI18n.GetString('KVMButtons_CtrlAltDel')),
                    icon: ['fa-solid', 'fa-gear'],
                    onclick() {
                        // Ctrl
                        self.vm.key(0xffe3, true);
                        // Alt
                        self.vm.key(0xffe9, true);
                        // Del
                        self.vm.key(0xffff, true);
                        // Ctrl
                        self.vm.key(0xffe3, false);
                        // Alt
                        self.vm.key(0xffe9, false);
                        // Del
                        self.vm.key(0xffff, false);
                    },
                    show: true
                }
            ]
        },
        staffBtns() {
            return [

            ]
        }
    },
    components: {
        FontAwesomeIcon
    }
});
</script>