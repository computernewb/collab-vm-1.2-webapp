<template>
    <div class="vm-display" :class="displayClass" ref="display"></div>
    <turncounter ref="turncounter"/>
    <!-- vtr -->
    <div class="vm-btns">
        <div class="vm-user-btns">

        </div>
        <div class="vm-staff-btns">

        </div>
        <div class="vm-osk-container">

        </div>
    </div>
    <div class="row container-fluid">
        <div class="col-md-4">
            <vmusertable :users="vm.users" />
        </div>
        <div class="col-md-8">
            <vmchat ref="vmchat" :username="username" @chat="(msg) => vm.chat(msg)" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import vmusertable from './vmusertable.vue';
import turncounter from './turncounter.vue';
import vmchat from './vmchat.vue';
import CollabVMClient from '../../ts/protocol/CollabVMClient';
import { TurnState } from '../../ts/protocol/TurnStatus';
export default defineComponent({
    props: {
        vm: {
            type: CollabVMClient,
            required: true
        }
    },
    data() {
        return {
            turnState: TurnState.None
        }
    },
    mounted() {
        (this.$refs.display as HTMLDivElement).appendChild(this.vm.canvas);
        // Chat message handler
        this.vm.on("chat", (username, message) => (this.$refs.vmchat as typeof vmchat.methods)!.chatMessage(username, message));
        // Turn queue handler
        this.vm.on("turn", (turnStatus) => {
            (this.$refs.turncounter as typeof turncounter.methods)!.turnUpdate(turnStatus);

            if (turnStatus.turnTime !== null) {
                this.turnState = TurnState.HasTurn;
            } else if (turnStatus.queueTime !== null) {
                this.turnState = TurnState.Waiting;
            } else {
                this.turnState = TurnState.None;
            }

        });
    },
    components: {
        vmusertable,
        vmchat,
        turncounter
    },
    computed: {
        username() {
            return this.vm.username ?? "";
        },
        displayClass() {
            let classlist = []
            // turn state
            switch (this.turnState) {
                case TurnState.HasTurn: {
                    classlist.push("vm-display-turn");
                    break;
                }
                case TurnState.Waiting: {
                    classlist.push("vm-display-waiting");
                    break;
                }
            }

            return classlist;
        },
    }
});
</script>